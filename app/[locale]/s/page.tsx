import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function Home() {
  const t = useTranslations('IndexPage');

  return (
    <div>
      <h1 className='text-4xl mb-4 font-semibold'>{t('title')}</h1>
      <p>{t('description')}</p>
      <Link
        href="/s"
        className='text-4xl text-red-500'
      >
        Link
      </Link>
    </div>
  );
}