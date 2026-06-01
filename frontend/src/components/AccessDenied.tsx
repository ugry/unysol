import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  const moduleName = sessionStorage.getItem('unysol_403') || '';

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 rounded-full bg-[#DC2626]/10 flex items-center justify-center mb-4">
        <ShieldAlert size={32} className="text-[#DC2626]" />
      </div>
      <h2 className="text-lg font-semibold text-[#f7f8f8] mb-2">Erişim Reddedildi</h2>
      <p className="text-sm text-[#8a8f98] text-center max-w-md">
        Bu modüle erişim izniniz bulunmamaktadır. Lütfen sistem yöneticinizle iletişime geçin.
      </p>
      {moduleName && (
        <p className="text-xs text-[#62666d] mt-2 font-mono">{moduleName}</p>
      )}
    </div>
  );
}
