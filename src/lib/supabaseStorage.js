/**
 * Supabase Storage & Database Sync Service — Colégio Rodin
 * Gerenciamento de fotos de perfil (bucket 'avatars') e sincronização de dados (public.profiles).
 */

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (import.meta.env?.DEV) {
    console.error('Configuração de ambiente: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.');
  }
}

/**
 * Exclui a foto antiga do bucket 'avatars' no Supabase Storage se for uma foto hospedada no Supabase.
 */
export async function deleteAvatarFromSupabase(avatarUrl) {
  if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.includes('/storage/v1/object/public/avatars/')) {
    return;
  }

  try {
    const objectPath = avatarUrl.split('/storage/v1/object/public/avatars/')[1];
    if (!objectPath) return;

    await fetch(`${SUPABASE_URL}/storage/v1/object/avatars`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ prefixes: [objectPath] })
    });
  } catch (err) {
    console.warn('Aviso: Não foi possível excluir a imagem antiga do Supabase Storage:', err);
  }
}

/**
 * Redimensiona e comprime uma imagem no navegador antes do upload para otimizar o tamanho.
 */
function compressImage(file, maxWidth = 500, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || typeof window === 'undefined' || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File([blob], file.name ? file.name.replace(/\.[^/.]+$/, '.jpg') : 'avatar.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Faz o upload de um arquivo de foto de perfil para o bucket 'avatars' do Supabase Storage.
 * Exclui automaticamente a foto antiga do storage se houver substituição.
 */
export async function uploadAvatarToSupabase(file, userId = 'user', oldAvatarUrl = null) {
  if (!file) return null;

  // 1. Otimizar e comprimir a imagem antes de enviar (máx 500px de largura)
  const fileToUpload = await compressImage(file);

  // 2. Excluir a imagem antiga do Supabase Storage caso seja uma URL hospedada no Supabase
  if (oldAvatarUrl) {
    await deleteAvatarFromSupabase(oldAvatarUrl);
  }

  const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = `profiles/${cleanUserId}/${Date.now()}_avatar.jpg`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/avatars/${filePath}`;

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': fileToUpload.type || 'image/jpeg',
        'x-upsert': 'true'
      },
      body: fileToUpload
    });

    if (response.ok) {
      // URL pública oficial do objeto no Supabase Storage
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;
      return publicUrl;
    } else {
      const errText = await response.text();
      console.error('Erro no Supabase Storage response:', response.status, errText);
    }
  } catch (err) {
    console.error('Erro de rede ao enviar para o Supabase Storage:', err);
  }

  return null;
}

/**
 * Busca todos os perfis atualizados diretamente da tabela public.profiles do Supabase.
 */
export async function fetchProfilesFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Erro ao buscar perfis do Supabase:', err);
  }
  return null;
}

/**
 * Atualiza os dados do perfil (public.profiles) no banco de dados Supabase via REST API.
 */
export async function updateProfileInSupabase(profileData) {
  if (!profileData) return false;

  const payload = {
    name: profileData.name,
    email: profileData.email,
    avatar_url: profileData.avatar
  };

  try {
    // 1. Tentar atualizar por id do perfil
    let endpoint = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(profileData.id)}`;
    let response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    // 2. Se não encontrou por ID, tentar por e-mail
    if (!response.ok && profileData.email) {
      endpoint = `${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(profileData.email)}`;
      response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    }

    return response.ok;
  } catch (err) {
    console.warn('Sincronização em tempo real com Supabase DB indisponível:', err);
    return false;
  }
}

/**
 * Sincroniza a rematrícula (Alunos e Responsáveis) com o Supabase via REST API.
 */
export async function syncEnrollmentToSupabase(enrollmentData) {
  if (!enrollmentData || !enrollmentData.rmNumber) return false;

  const rm = String(enrollmentData.rmNumber);
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // 1. Sincronizar Aluno (public.students)
    const studentPayload = {
      rm_number: rm,
      coc_code: rm,
      name: enrollmentData.studentName || enrollmentData.name || `Estudante RM ${rm}`,
      enrollment_code: `RM ${rm}`,
      gender: enrollmentData.studentGender || 'Masc.',
      birth_date: enrollmentData.studentBirthDate || null,
      birth_city: enrollmentData.studentBirthCity || 'Indaiatuba - SP',
      nationality: enrollmentData.studentNationality || 'Brasileiro(a)',
      rg: enrollmentData.studentRg || null,
      rg_issuer: enrollmentData.studentRgIssuer || 'SSP/SP',
      rg_issue_date: enrollmentData.studentRgIssueDate || null,
      cpf: enrollmentData.studentCpf || null,
      student_phone: enrollmentData.studentPhone || null,
      course_level: enrollmentData.courseLevel || 'Ensino Fundamental',
      current_grade: enrollmentData.currentGrade || '6º Ano EF',
      school_shift: enrollmentData.schoolShift || 'Manhã'
    };

    let studentRes = await fetch(`${SUPABASE_URL}/rest/v1/students?rm_number=eq.${encodeURIComponent(rm)}`, {
      method: 'GET',
      headers
    });
    let existingStudents = await studentRes.json();
    let studentId = null;

    if (Array.isArray(existingStudents) && existingStudents.length > 0) {
      studentId = existingStudents[0].id;
      await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(studentPayload)
      });
    } else {
      let postRes = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: 'POST',
        headers,
        body: JSON.stringify(studentPayload)
      });
      let posted = await postRes.json();
      if (Array.isArray(posted) && posted.length > 0) {
        studentId = posted[0].id;
      }
    }

    // 2. Sincronizar Responsável Legal/Financeiro (public.guardians)
    if (enrollmentData.guardianCpf || enrollmentData.guardianName) {
      const guardianPayload = {
        name: enrollmentData.guardianName || 'Responsável Legal',
        kinship_relation: enrollmentData.guardianRelation || 'Pai',
        cpf: enrollmentData.guardianCpf || null,
        rg: enrollmentData.guardianRg || null,
        rg_issuer: enrollmentData.guardianRgIssuer || 'SSP/SP',
        birth_date: enrollmentData.guardianBirthDate || null,
        occupation: enrollmentData.guardianOccupation || null,
        marital_status: enrollmentData.guardianMaritalStatus || null,
        nationality: enrollmentData.guardianNationality || 'Brasileiro(a)',
        email: enrollmentData.guardianEmail || null,
        phone_mobile: enrollmentData.guardianPhone || null,
        phone_landline: enrollmentData.guardianLandline || null,
        address_cep: enrollmentData.guardianAddressCep || null,
        address_street: enrollmentData.guardianAddressStreet || null,
        address_number: enrollmentData.guardianAddressNumber || null,
        address_complement: enrollmentData.guardianAddressComplement || null,
        address_neighborhood: enrollmentData.guardianAddressNeighborhood || null,
        address_city: enrollmentData.guardianAddressCity || 'Indaiatuba',
        address_state: enrollmentData.guardianAddressState || 'SP'
      };

      let guardianQuery = enrollmentData.guardianCpf 
        ? `cpf=eq.${encodeURIComponent(enrollmentData.guardianCpf)}`
        : `email=eq.${encodeURIComponent(enrollmentData.guardianEmail)}`;

      let guardianRes = await fetch(`${SUPABASE_URL}/rest/v1/guardians?${guardianQuery}`, {
        method: 'GET',
        headers
      });
      let existingGuardians = await guardianRes.json();
      let guardianId = null;

      if (Array.isArray(existingGuardians) && existingGuardians.length > 0) {
        guardianId = existingGuardians[0].id;
        await fetch(`${SUPABASE_URL}/rest/v1/guardians?id=eq.${guardianId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(guardianPayload)
        });
      } else if (enrollmentData.guardianName) {
        let postG = await fetch(`${SUPABASE_URL}/rest/v1/guardians`, {
          method: 'POST',
          headers,
          body: JSON.stringify(guardianPayload)
        });
        let postedG = await postG.json();
        if (Array.isArray(postedG) && postedG.length > 0) {
          guardianId = postedG[0].id;
        }
      }

      // 3. Vincular Aluno e Responsável (public.student_guardians)
      if (studentId && guardianId) {
        await fetch(`${SUPABASE_URL}/rest/v1/student_guardians`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates' },
          body: JSON.stringify({
            student_id: studentId,
            guardian_id: guardianId,
            is_financial_responsible: true,
            is_pedagogical_responsible: true
          })
        });
      }
    }

    return true;
  } catch (err) {
    console.warn('Erro ao sincronizar rematrícula com Supabase:', err);
    return false;
  }
}
