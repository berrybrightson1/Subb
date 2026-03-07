export type ToastType = 'success' | 'error' | 'info' | 'profile';
type ShowFn = (type: ToastType, message: string) => void;

let _show: ShowFn | null = null;

export function _registerToast(fn: ShowFn) {
  _show = fn;
}

export const toast = {
  success: (message: string) => _show?.('success', message),
  error: (message: string) => _show?.('error', message),
  info: (message: string) => _show?.('info', message),
  profile: (message: string) => _show?.('profile', message),
};
