export const CHAT_LOGIN_URL = '/login?chat=1';
export const CHAT_SIGNUP_URL = '/cadastro?chat=1';

export function shouldResumeChat(search: string, role: string): boolean {
  return (
    role !== 'super_admin' && new URLSearchParams(search).get('chat') === '1'
  );
}
