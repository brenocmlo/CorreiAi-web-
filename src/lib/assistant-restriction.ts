import type { AssistantContext } from '../types/assistant';
import { CHAT_LOGIN_URL } from './assistant-auth-flow';

export function assistantRestriction(
  reason: AssistantContext['restrictionReason'],
) {
  if (reason === 'company_required')
    return {
      message:
        'Sua conta está sem vínculo com uma imobiliária. Você pode consultar as ofertas pelo link público de atendimento dessa imobiliária. Para acesso ao catálogo interno, solicite a liberação ao administrador.',
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
      'Para ver imóveis e preços sem login, abra o link público de atendimento da imobiliária. Aqui posso responder dúvidas gerais. Se você já tem uma conta vinculada, também pode entrar para consultar seu catálogo privado.',
    action: { href: CHAT_LOGIN_URL, label: 'Já tenho conta' },
  };
}
