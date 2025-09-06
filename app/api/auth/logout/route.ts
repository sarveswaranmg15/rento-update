import { NextRequest } from 'next/server'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Logging out...</title>
  </head>
  <body>
    <p>Logging out...</p>
    <script>
      (function(){
        try {
          // clear sessionStorage
          try { sessionStorage.removeItem('profile'); } catch(e) {}
          try { sessionStorage.clear(); } catch(e) {}

          // list of common auth cookie names to clear
          const names = ['session','token','next-auth.session-token','next-auth.callback-url','sb:token','rento_session','tenant_schema','super_admin'];
          const path = ';path=/';
          const expires = ';expires=Thu, 01 Jan 1970 00:00:00 GMT';
          names.forEach(n => {
            document.cookie = n + '=;' + path + expires;
            document.cookie = n + '=;Domain=' + location.hostname + path + expires;
          });
        } catch(e) {}
        // redirect to home page
        location.href = '/';
      })();
    </script>
  </body>
</html>`

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
