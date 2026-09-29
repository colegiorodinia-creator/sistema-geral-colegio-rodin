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
 * Helper para validar e formatar datas para o formato DATE (YYYY-MM-DD) do PostgreSQL/Supabase.
 */
function toValidDbDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  // Se estiver no formato brasileiro DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${y}-${m}-${d}`;
  }
  // Se estiver no formato padrão ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  // Se for string ISO com timestamp (ex: 2014-09-09T00:00:00.000Z)
  if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }
  return null;
}

/**
 * Busca todos os estudantes cadastrados na tabela public.students do Supabase.
 */
export async function fetchStudentsFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/students?select=*&limit=1000`, {
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
    console.warn('Erro ao buscar estudantes do Supabase:', err);
  }
  return null;
}

/**
 * Sincroniza a rematrícula completa (Alunos, Responsáveis, Matrículas e Contratos) com o Supabase via REST API.
 */
export async function syncEnrollmentToSupabase(enrollmentData, updatedStudent = null) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;

  const rm = String(updatedStudent?.rmNumber || enrollmentData?.rmNumber || updatedStudent?.cocCode || enrollmentData?.cocCode || '');
  if (!rm) return false;

  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // 1. Sincronizar Aluno (public.students)
    const studentName = updatedStudent?.name || updatedStudent?.studentName || enrollmentData?.studentName || enrollmentData?.name || `Estudante RM ${rm}`;
    const enrollmentCode = enrollmentData?.enrollmentCode || updatedStudent?.enrollmentCode || `ROD-${enrollmentData?.academicYear || 2027}-${rm}`;

    const studentPayload = {
      name: studentName,
      rm_number: rm,
      coc_code: rm,
      enrollment_code: enrollmentCode,
      gender: updatedStudent?.gender || updatedStudent?.studentGender || enrollmentData?.studentGender || 'Masc.',
      birth_date: toValidDbDate(updatedStudent?.birthDate || updatedStudent?.studentBirthDate || enrollmentData?.studentBirthDate),
      birth_city: updatedStudent?.birthCity || updatedStudent?.studentBirthCity || enrollmentData?.studentBirthCity || 'Indaiatuba',
      nationality: updatedStudent?.nationality || updatedStudent?.studentNationality || enrollmentData?.studentNationality || 'Brasileira',
      rg: updatedStudent?.rg || updatedStudent?.studentRg || enrollmentData?.studentRg || null,
      rg_issuer: updatedStudent?.rgIssuer || updatedStudent?.studentRgIssuer || enrollmentData?.studentRgIssuer || 'SSP/SP',
      rg_issue_date: toValidDbDate(updatedStudent?.rgIssueDate || updatedStudent?.studentRgIssueDate || enrollmentData?.studentRgIssueDate),
      cpf: updatedStudent?.cpf || updatedStudent?.studentCpf || enrollmentData?.studentCpf || null,
      student_phone: updatedStudent?.phone || updatedStudent?.studentPhone || enrollmentData?.studentPhone || null,
      course_level: updatedStudent?.courseLevel || enrollmentData?.courseLevel || 'Ensino Fundamental',
      current_grade: updatedStudent?.currentGrade || enrollmentData?.currentGrade || '6º Ano EF',
      class_group: updatedStudent?.classGroup || enrollmentData?.classGroup || 'A',
      school_shift: updatedStudent?.schoolShift || enrollmentData?.schoolShift || 'Manhã',
      school_unit: updatedStudent?.schoolUnit || enrollmentData?.schoolUnit || 'Colégio Rodin - Indaiatuba',
      special_needs_desc: updatedStudent?.condition || updatedStudent?.specialNeedsDesc || 'Normal',
      medical_allergies: updatedStudent?.medicalAllergies || enrollmentData?.medicalAllergies || 'Nenhuma restrição cadastrada.',
      emergency_contact: updatedStudent?.emergencyContact || enrollmentData?.emergencyContact || enrollmentData?.guardianPhone || null,
      photo_url: updatedStudent?.photoUrl || enrollmentData?.photoUrl || null,
      attendance_rate: updatedStudent?.attendanceRate || '98%',
      is_le_perini: Boolean(updatedStudent?.isLePerini !== undefined ? updatedStudent.isLePerini : enrollmentData?.isLePerini)
    };

    let studentId = null;

    // Buscar aluno existente no Supabase pelo RM
    const studentRes = await fetch(`${SUPABASE_URL}/rest/v1/students?rm_number=eq.${encodeURIComponent(rm)}`, {
      method: 'GET',
      headers
    });

    if (studentRes.ok) {
      const existingStudents = await studentRes.json();
      if (Array.isArray(existingStudents) && existingStudents.length > 0) {
        studentId = existingStudents[0].id;
      }
    }

    // Fallback: verificar se updatedStudent.id é um UUID válido
    if (!studentId && updatedStudent?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedStudent.id)) {
      studentId = updatedStudent.id;
    }

    if (studentId) {
      await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(studentPayload)
      });
    } else {
      const postRes = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: 'POST',
        headers,
        body: JSON.stringify(studentPayload)
      });
      if (postRes.ok) {
        const posted = await postRes.json();
        if (Array.isArray(posted) && posted.length > 0) {
          studentId = posted[0].id;
        }
      }
    }

    // 2. Sincronizar Responsável Legal/Financeiro (public.guardians)
    const guardianObj = (updatedStudent?.guardians && updatedStudent.guardians[0]) || {};
    const guardianName = enrollmentData?.guardianName || guardianObj.name || guardianObj.guardianName;
    const guardianCpf = enrollmentData?.guardianCpf || guardianObj.cpf || guardianObj.guardianCpf;

    let guardianId = null;

    if (guardianName || guardianCpf) {
      const guardianPayload = {
        name: guardianName || 'Responsável Legal',
        kinship_relation: enrollmentData?.guardianRelation || guardianObj.kinshipRelation || guardianObj.guardianRelation || 'Pai',
        cpf: guardianCpf || null,
        rg: enrollmentData?.guardianRg || guardianObj.rg || guardianObj.guardianRg || null,
        rg_issuer: enrollmentData?.guardianRgIssuer || guardianObj.rgIssuer || guardianObj.guardianRgIssuer || 'SSP/SP',
        birth_date: toValidDbDate(enrollmentData?.guardianBirthDate || guardianObj.birthDate || guardianObj.guardianBirthDate),
        occupation: enrollmentData?.guardianOccupation || guardianObj.occupation || guardianObj.guardianOccupation || null,
        marital_status: enrollmentData?.guardianMaritalStatus || guardianObj.maritalStatus || guardianObj.guardianMaritalStatus || 'Casado(a)',
        nationality: enrollmentData?.guardianNationality || guardianObj.nationality || guardianObj.guardianNationality || 'Brasileira',
        email: enrollmentData?.guardianEmail || guardianObj.email || guardianObj.guardianEmail || null,
        phone_mobile: enrollmentData?.guardianPhone || guardianObj.phoneMobile || guardianObj.guardianPhone || null,
        phone_landline: enrollmentData?.guardianLandline || guardianObj.phoneLandline || guardianObj.guardianLandline || null,
        address_cep: enrollmentData?.guardianAddressCep || guardianObj.addressCep || guardianObj.guardianAddressCep || null,
        address_street: enrollmentData?.guardianAddressStreet || guardianObj.addressStreet || guardianObj.guardianAddressStreet || null,
        address_number: enrollmentData?.guardianAddressNumber || guardianObj.addressNumber || guardianObj.guardianAddressNumber || null,
        address_complement: enrollmentData?.guardianAddressComplement || guardianObj.addressComplement || guardianObj.guardianAddressComplement || null,
        address_neighborhood: enrollmentData?.guardianAddressNeighborhood || guardianObj.addressNeighborhood || guardianObj.guardianAddressNeighborhood || null,
        address_city: enrollmentData?.guardianAddressCity || guardianObj.addressCity || guardianObj.guardianAddressCity || 'Indaiatuba',
        address_state: enrollmentData?.guardianAddressState || guardianObj.addressState || guardianObj.guardianAddressState || 'SP'
      };

      // Verificar se já existe vínculo na tabela student_guardians
      if (studentId) {
        const linkRes = await fetch(`${SUPABASE_URL}/rest/v1/student_guardians?student_id=eq.${studentId}&select=guardian_id`, {
          method: 'GET',
          headers
        });
        if (linkRes.ok) {
          const links = await linkRes.json();
          if (Array.isArray(links) && links.length > 0 && links[0].guardian_id) {
            guardianId = links[0].guardian_id;
          }
        }
      }

      // Se não encontrou pelo vínculo, buscar por CPF
      if (!guardianId && guardianCpf) {
        const gRes = await fetch(`${SUPABASE_URL}/rest/v1/guardians?cpf=eq.${encodeURIComponent(guardianCpf)}`, {
          method: 'GET',
          headers
        });
        if (gRes.ok) {
          const foundG = await gRes.json();
          if (Array.isArray(foundG) && foundG.length > 0) {
            guardianId = foundG[0].id;
          }
        }
      }

      if (guardianId) {
        await fetch(`${SUPABASE_URL}/rest/v1/guardians?id=eq.${guardianId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(guardianPayload)
        });
      } else {
        const postG = await fetch(`${SUPABASE_URL}/rest/v1/guardians`, {
          method: 'POST',
          headers,
          body: JSON.stringify(guardianPayload)
        });
        if (postG.ok) {
          const postedG = await postG.json();
          if (Array.isArray(postedG) && postedG.length > 0) {
            guardianId = postedG[0].id;
          }
        }
      }

      // Garantir o vínculo na tabela student_guardians
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

    // 3. Sincronizar Matrícula/Rematrícula (public.enrollments)
    const academicYear = parseInt(enrollmentData?.academicYear || updatedStudent?.academicYear || 2027);
    let enrollmentId = null;

    if (studentId) {
      const enrQueryRes = await fetch(`${SUPABASE_URL}/rest/v1/enrollments?student_id=eq.${studentId}&academic_year=eq.${academicYear}`, {
        method: 'GET',
        headers
      });

      let existingEnrollments = [];
      if (enrQueryRes.ok) {
        existingEnrollments = await enrQueryRes.json();
      }

      const validStatus = ['draft', 'pending_signature', 'active', 'cancelled', 'pending_reenrollment'].includes(enrollmentData?.status)
        ? enrollmentData.status
        : (enrollmentData?.status === 'reenrolled' ? 'active' : 'pending_reenrollment');

      const enrollmentPayload = {
        enrollment_code: enrollmentCode,
        student_id: studentId,
        academic_year: academicYear,
        course_level: enrollmentData?.courseLevel || updatedStudent?.courseLevel || 'Ensino Fundamental',
        current_grade: enrollmentData?.currentGrade || updatedStudent?.currentGrade || '6º Ano EF',
        class_group: enrollmentData?.classGroup || updatedStudent?.classGroup || 'A',
        status: validStatus,
        school_contract_status: enrollmentData?.schoolContractStatus || 'pending',
        material_contract_status: enrollmentData?.materialContractStatus || 'pending',
        updated_at: new Date().toISOString()
      };

      if (Array.isArray(existingEnrollments) && existingEnrollments.length > 0) {
        enrollmentId = existingEnrollments[0].id;
        await fetch(`${SUPABASE_URL}/rest/v1/enrollments?id=eq.${enrollmentId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(enrollmentPayload)
        });
      } else {
        const postEnr = await fetch(`${SUPABASE_URL}/rest/v1/enrollments`, {
          method: 'POST',
          headers,
          body: JSON.stringify(enrollmentPayload)
        });
        if (postEnr.ok) {
          const postedEnr = await postEnr.json();
          if (Array.isArray(postedEnr) && postedEnr.length > 0) {
            enrollmentId = postedEnr[0].id;
          }
        }
      }
    }

    // 4. Sincronizar Contrato Financeiro (public.contracts)
    if (studentId && enrollmentId && enrollmentData) {
      const contractQueryRes = await fetch(`${SUPABASE_URL}/rest/v1/contracts?enrollment_id=eq.${enrollmentId}`, {
        method: 'GET',
        headers
      });

      let existingContracts = [];
      if (contractQueryRes.ok) {
        existingContracts = await contractQueryRes.json();
      }

      const contractPayload = {
        contract_code: `CTR-${academicYear}-${rm}`,
        enrollment_id: enrollmentId,
        student_id: studentId,
        status: (enrollmentData.schoolContractStatus === 'signed' || enrollmentData.status === 'active' || enrollmentData.status === 'reenrolled') ? 'signed' : 'pending',
        tuition_gross_total: Number(enrollmentData.tuitionGrossTotal || 0),
        tuition_nominal_total: Number(enrollmentData.tuitionNominalTotal || enrollmentData.tuitionGrossTotal || 0),
        tuition_discount_total: Number(enrollmentData.tuitionDiscountTotal || 0),
        tuition_discount_percentage: (() => {
          const rawPct = Number(enrollmentData.tuitionDiscountPercentage || 0);
          const decimalPct = rawPct > 1 ? rawPct / 100 : rawPct;
          return Number(decimalPct.toFixed(4));
        })(),
        tuition_discount_reason: enrollmentData.tuitionDiscountReason || '',
        tuition_discount_type: enrollmentData.tuitionDiscountType || 'Sem desconto',
        installments_count: parseInt(enrollmentData.installmentsCount) || 13,
        first_installment_value: Number(enrollmentData.firstInstallmentValue || 0),
        regular_installment_value: Number(enrollmentData.regularInstallmentValue || 0),
        material_total_value: Number(enrollmentData.materialTotalValue || 0),
        material_total_extenso: enrollmentData.materialTotalExtenso || '',
        material_installments_count: parseInt(enrollmentData.materialInstallmentsCount) || 12,
        material_installment_value: Number(enrollmentData.materialInstallmentValue || 0),
        material_installment_extenso: enrollmentData.materialInstallmentExtenso || '',
        material_start_due_date: enrollmentData.materialStartDueDate || '',
        material_end_due_date: enrollmentData.materialEndDueDate || ''
      };

      if (Array.isArray(existingContracts) && existingContracts.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/contracts?id=eq.${existingContracts[0].id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(contractPayload)
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/contracts`, {
          method: 'POST',
          headers,
          body: JSON.stringify(contractPayload)
        });
      }
    }

    return true;
  } catch (err) {
    console.error('Erro ao sincronizar rematrícula com Supabase:', err);
    return false;
  }
}

