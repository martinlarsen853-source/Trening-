import { CommonRoomsClient } from '@/components/CommonRoomsClient';

export const revalidate = 0;

const ROOMS = ['Stue 400 gang', 'Felles rom 2C'];

export default function FellesromPage() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-5">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Fellesrom</h1>
      <p className="text-sm text-gray-500 mb-6">Se hvem som er ute, og meld at du er i stua.</p>
      <CommonRoomsClient rooms={ROOMS} />
    </div>
  );
}
