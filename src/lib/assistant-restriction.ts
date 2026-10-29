import type { AssistantContext } from '../types/assistant';
import { CHAT_LOGIN_URL } from './assistant-auth-flow';

export function assistantRestriction(
  reason: AssistantContext['restrictionReason'],
) {
  if (reason === 'company_required')
    return {
      message:
        'Sua conta está sem vínculo com uma imobiliária. Solicite a liberação ao administrador da imobiliária para consultar seus imóveis e preços.',
      action: null,
    };
  if (reason === 'admin_only')
    return {
      message:
        'O administrador geral gerencia as imobiliárias. Para consultar um catálogo no chat, use uma conta de corretor ou cliente vinculada à imobiliária.',
      action: { href: '/admin/imobiliarias', label: 'Gerenciar imobiliárias' },
    };
  return {
    message:
      'Para ver imóveis e preços, entre com uma conta vinculada à imobiliária. Sem esse acesso, posso responder dúvidas gerais, mas não consultar o catálogo privado.',
    action: { href: CHAT_LOGIN_URL, label: 'Entrar para ver imóveis' },
  };
}
