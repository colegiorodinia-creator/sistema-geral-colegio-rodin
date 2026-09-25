import urllib.request
import urllib.error

urls = [
    'https://jhjzyoztidfwzqeblhch.supabase.co',
    'https://jhjzyoztidfwzqeblhc.supabase.co',
    'https://jhjzyoztidfwzqeblh.supabase.co',
    'https://jhjzyoztidfwzqebl.supabase.co',
]

for url in urls:
    try:
        req = urllib.request.Request(f"{url}/rest/v1/", headers={'User-Agent': 'Mozilla/5.0'})
        res = urllib.request.urlopen(req)
        print(f"URL: {url} -> Status: {res.status}")
    except urllib.error.HTTPError as e:
        print(f"URL: {url} -> HTTP Status: {e.code} (Server reachable!)")
    except Exception as e:
        print(f"URL: {url} -> Error: {e}")
