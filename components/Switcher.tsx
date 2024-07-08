'use client';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChangeEvent, useTransition } from 'react';

export default function Switcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const localActive = useLocale();

  const toggleLocale = () => {
    const nextLocale = localActive === 'en' ? 'bn' : 'en';
    startTransition(() => {
      router.replace(`/${nextLocale}`);
    });
  };

  return (
    <button
      className="text-gray-700 hover:bg-secondary py-2 px-4 rounded-md bg-white text-sm leading-none select-none cursor-pointer"
      onClick={toggleLocale}
      disabled={isPending}
    >
      {localActive === 'en' ? 'বাংলা' : 'English'}
    </button>
  );
}
