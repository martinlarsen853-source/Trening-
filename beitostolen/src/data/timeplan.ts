import type { TimeplanActivity, TimeplanDay } from '@/lib/supabase';

type StaticActivity = Omit<TimeplanActivity, 'myAbsence' | 'relevantAbsences'>;
type StaticDay = { dayOfWeek: number; main: StaticActivity[]; fritid: StaticActivity[] };

function hydrate(days: StaticDay[]): TimeplanDay[] {
  return days.map((d) => ({
    dayOfWeek: d.dayOfWeek,
    main: d.main.map((a) => ({ ...a, myAbsence: false, relevantAbsences: [] })),
    fritid: d.fritid.map((a) => ({ ...a, myAbsence: false, relevantAbsences: [] })),
  }));
}

// ─── Uke 2026-05-18 ──────────────────────────────────────────────────────────

const WEEK_2026_05_18: StaticDay[] = [
  {
    dayOfWeek: 1,
    main: [
      { id: '9edbdaa9-432a-4e4e-8291-a99dd747e77b', name: 'SKOLE', time_start: '09:00:00', time_end: '10:00:00', location: null, notes: null, day_of_week: 1, group_name: 'blå', target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: 'cb9344b6-082c-4a28-9038-c7bf32c6079e', name: 'LEKEROM', time_start: '09:15:00', time_end: '10:00:00', location: null, notes: null, day_of_week: 1, group_name: 'gul', target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: '2a7a9f8a-9f67-4594-8a3b-3d74d08392b5', name: 'GYMSAL', time_start: '11:30:00', time_end: '12:00:00', location: 'Bevegels til musikk', notes: null, day_of_week: 1, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: '7fb54787-02ef-41af-9c64-4cdc452fb572', name: 'SYKKELAKTIVITET', time_start: '14:15:00', time_end: '15:00:00', location: 'Oppmøte på idrettsbanen', notes: 'm/ledsagere', day_of_week: 1, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
    ],
    fritid: [
      { id: '6ebdc3a5-d946-4750-a2c7-67ff506bb843', name: 'BASSENG', time_start: '17:00:00', time_end: '18:00:00', location: null, notes: null, day_of_week: 1, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
    ],
  },
  {
    dayOfWeek: 2,
    main: [
      { id: '5113e542-0a61-42d0-a8fc-9870b6c5957f', name: 'SKOLE', time_start: '09:00:00', time_end: '10:00:00', location: null, notes: null, day_of_week: 2, group_name: 'blå', target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: 'ff044b07-e401-4fa2-9354-c636eedaff5e', name: 'AKTIVITETSROM 1', time_start: '10:15:00', time_end: '11:00:00', location: null, notes: null, day_of_week: 2, group_name: 'gul', target_child: null, is_adult_meeting: false, load_level: 'middels', staff_name: null, staff_id: null },
      { id: 'cbdefaa7-308e-4d31-a643-4a3b6b9d5bb1', name: 'SKOLE', time_start: '10:15:00', time_end: '11:15:00', location: null, notes: null, day_of_week: 2, group_name: 'blå', target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: '9950ee88-dea9-4c71-b0e7-bab08b01de38', name: 'GYMSAL', time_start: '11:30:00', time_end: '12:00:00', location: 'Samarbeid', notes: null, day_of_week: 2, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: 'f09dddc3-2461-466a-8243-1deba3a0f0db', name: 'BASSENG', time_start: '13:45:00', time_end: '14:30:00', location: 'Ferdighetstrening og frilek', notes: null, day_of_week: 2, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
    ],
    fritid: [
      { id: '4feed909-97d3-41ae-815a-99058cb387df', name: 'SKYTING', time_start: '16:30:00', time_end: '17:30:00', location: 'SKYTEROM', notes: null, day_of_week: 2, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'middels', staff_name: null, staff_id: null },
      { id: 'fbac0ebd-3ab3-47ab-8c3d-ba71d02ea987', name: 'BOCCIA', time_start: '18:30:00', time_end: '19:30:00', location: 'GYMSAL', notes: null, day_of_week: 2, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
    ],
  },
  {
    dayOfWeek: 3,
    main: [
      { id: 'fa5bcb20-44ac-461a-a1bb-5100e4414427', name: 'SKOLE', time_start: '09:00:00', time_end: '10:00:00', location: null, notes: null, day_of_week: 3, group_name: 'blå', target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: 'aefb3c55-dc85-4068-9eaa-746c59878529', name: 'AKTIVITETSROM 1', time_start: '10:15:00', time_end: '11:15:00', location: null, notes: null, day_of_week: 3, group_name: 'gul', target_child: null, is_adult_meeting: false, load_level: 'middels', staff_name: null, staff_id: null },
      { id: '94096d52-dabf-49e1-aeb4-3d1f53d1f25c', name: 'SKOLE', time_start: '10:15:00', time_end: '11:15:00', location: null, notes: null, day_of_week: 3, group_name: 'blå', target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: '3a1c916f-cc23-4ce2-8ce2-35c7083017c2', name: 'GYMSAL', time_start: '11:30:00', time_end: '12:00:00', location: 'Boksing', notes: null, day_of_week: 3, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: '2fb25aea-a1d6-4de4-aae1-78653b37fdeb', name: 'SYKKELAKTIVITET', time_start: '14:15:00', time_end: '15:00:00', location: null, notes: 'm/ledsagere', day_of_week: 3, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
    ],
    fritid: [
      { id: 'd1dd3a09-6616-4e8b-bb28-087cdf088228', name: 'BASSENG', time_start: '17:00:00', time_end: '17:45:00', location: null, notes: null, day_of_week: 3, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: '8c950cf9-94ba-481f-b5d8-a97a96ead96e', name: 'MUSIKK-BINGO', time_start: '18:15:00', time_end: '19:00:00', location: 'PERSONALKANTINA', notes: null, day_of_week: 3, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
    ],
  },
  {
    dayOfWeek: 4,
    main: [
      { id: '293c74bb-cfa6-498e-aa0d-f19aba7af6d6', name: 'IDRETTSHALL', time_start: '09:15:00', time_end: '10:00:00', location: 'Aktivitetsbingo og klatring', notes: null, day_of_week: 4, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: '7022df85-0678-4449-9b3b-03c05d214b5e', name: 'BASSENG', time_start: '11:00:00', time_end: '11:45:00', location: 'Ferdighetstrening og felleslek', notes: null, day_of_week: 4, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: 'c2f95250-3162-4f55-a803-f1d91f5deb47', name: 'STALL/UTEAKTIVITET', time_start: '13:00:00', time_end: '15:00:00', location: 'Ridning og Sykling', notes: 'Se lapp for detaljer', day_of_week: 4, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'middels', staff_name: null, staff_id: null },
    ],
    fritid: [
      { id: '4d5b1814-145b-4e36-a036-14f32ab28ce1', name: 'FORMING', time_start: '17:00:00', time_end: '18:00:00', location: 'FORMINGSROM 1', notes: null, day_of_week: 4, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: '1accc23f-0e07-48d3-b594-f87f803059ed', name: 'SPILL/KAPLA', time_start: '18:15:00', time_end: '19:00:00', location: 'AKTIVITETSROM 1', notes: null, day_of_week: 4, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
    ],
  },
  {
    dayOfWeek: 5,
    main: [
      { id: '9c546d1a-903c-42ab-a102-f27423a99bc1', name: 'ÅPEN IDRETTSHALL', time_start: '09:15:00', time_end: '10:15:00', location: 'Klatring, elinnebandy og ballstasjoner', notes: 'Samtaler foregår i samme tidsrom · Studenter og Nicolai organiserer · m/ledsager', day_of_week: 5, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: 'dc681056-3d46-4b85-96cc-64e189989014', name: 'BASSENG', time_start: '11:00:00', time_end: '11:45:00', location: 'Ferdighetstrening og felleslek', notes: null, day_of_week: 5, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: '1aebedee-631c-48ae-9fb3-7d9a22597f70', name: 'STALL/UTEAKTIVITET', time_start: '13:00:00', time_end: '15:00:00', location: 'Ridning og Sykling', notes: 'Ridning 13:15–14:00: Mia, Evelina, Lars og Lucas · Ridning 14:15–15:00: Magnus, Alice, Sigurd og Cecilie · Sykling 13:15–14:00: Johannes, Jacob og Marianna', day_of_week: 5, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'middels', staff_name: null, staff_id: null },
      { id: '0fbc891c-f3b3-4bc9-aa69-01756f46d9ee', name: 'FLASK', time_start: '23:00:00', time_end: '23:45:00', location: 'Gymsal', notes: null, day_of_week: 5, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
    ],
    fritid: [
      { id: 'ba342320-57fa-45d6-8269-1f2511fd0bdd', name: 'SPILL', time_start: '17:00:00', time_end: '18:00:00', location: 'Aktivitetsrom 1', notes: null, day_of_week: 5, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
    ],
  },
  {
    dayOfWeek: 6,
    main: [
      { id: 'fe518697-18b7-41c8-95ea-73ce9315d1ca', name: 'UTEAKTIVITET', time_start: '09:15:00', time_end: '10:00:00', location: 'Orientering', notes: 'Oppmøte utenfor resepsjonen · Rebekka (fysioturnus) leder · Ledsagere deltar sammen med barna', day_of_week: 6, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'middels', staff_name: null, staff_id: null },
      { id: '2c6600ff-21f5-4445-a44f-5ffe4581d2ef', name: 'IDRETTSHALL', time_start: '11:15:00', time_end: '12:00:00', location: 'Boksing', notes: 'Rebekka (fysioturnus) leder · Ledsagere deltar sammen med barna', day_of_week: 6, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
    ],
    fritid: [
      { id: 'aa7fd0b2-bd15-40e9-a519-2b181cd42f57', name: 'ÅPEN HALL', time_start: '14:30:00', time_end: '15:30:00', location: 'Idrettshallen', notes: null, day_of_week: 6, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: '85b89edf-99ca-4d6c-a9ab-cc5cec603a67', name: 'BASSENG', time_start: '17:00:00', time_end: '18:00:00', location: null, notes: null, day_of_week: 6, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: 'bc089810-849b-45f0-966a-c622252d058d', name: 'Gymsal lek', time_start: '23:00:00', time_end: '23:59:00', location: 'Gymsal', notes: null, day_of_week: 6, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: 'Martine', staff_id: '96ae48d7-efde-48d7-8d7b-21ce539ed6cd' },
    ],
  },
  {
    dayOfWeek: 7,
    main: [],
    fritid: [
      { id: '9efb58dc-be40-44bb-a3e5-3590fcb78aeb', name: 'NATURBINGO', time_start: '10:00:00', time_end: '11:00:00', location: 'Riddercamp', notes: null, day_of_week: 7, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: '5531fe81-7dc1-4f21-b8e6-d2ae0e45f52b', name: 'FILM', time_start: '15:45:00', time_end: '17:15:00', location: 'Aktivitetsrom 1', notes: null, day_of_week: 7, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: '3a709238-cc3c-4ac5-a30d-a96ad6485291', name: 'BINGO FOR ALLE', time_start: '18:15:00', time_end: '19:15:00', location: 'Matsalen', notes: null, day_of_week: 7, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
    ],
  },
];

// ─── Uke 2026-05-25 ──────────────────────────────────────────────────────────

const WEEK_2026_05_25: StaticDay[] = [
  {
    dayOfWeek: 1,
    main: [
      { id: 'b9d1e103-e7f7-47be-a087-eedd5730cbee', name: 'IDRETTSHALL', time_start: '09:15:00', time_end: '10:00:00', location: 'Ønskereprise', notes: 'm/ledsagere', day_of_week: 1, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: '47ba0cdf-eb0d-4c38-91e8-f313049fa97f', name: 'BASSENG', time_start: '11:00:00', time_end: '11:45:00', location: 'Ferdighetstrening', notes: 'm/ledsagere', day_of_week: 1, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: '58640555-d53d-424f-89fb-7a4425e9813a', name: 'SYKKELAKTIVITET', time_start: '14:15:00', time_end: '15:00:00', location: 'Oppmøte ved sykkelstallen', notes: 'm/ledsagere', day_of_week: 1, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
    ],
    fritid: [],
  },
  {
    dayOfWeek: 2,
    main: [
      { id: '6bbc5f92-daa4-48f4-83a6-6076e68c1def', name: 'BRUKERFORUM', time_start: '08:30:00', time_end: '09:15:00', location: 'Aktivitetsrom 1', notes: 'For brukerrepresentant', day_of_week: 2, group_name: null, target_child: null, is_adult_meeting: true, load_level: null, staff_name: null, staff_id: null },
      { id: 'bdf3289c-eb8a-42de-a8c4-92aef5af583b', name: 'OPPFØLGINGSSAMTALE', time_start: '09:00:00', time_end: '09:45:00', location: null, notes: 'Utsatt fra mandag pga. sykdom', day_of_week: 2, group_name: null, target_child: 'Lukas', is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: '69d0821d-b762-4872-82bc-a2154f33d5d9', name: 'SKOLE', time_start: '09:00:00', time_end: '10:00:00', location: null, notes: null, day_of_week: 2, group_name: 'blå', target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: '940c6994-9a71-4a1a-ba81-5aff31c989a1', name: 'AKTIVITETSROM 1', time_start: '09:15:00', time_end: '10:00:00', location: null, notes: null, day_of_week: 2, group_name: 'gul', target_child: null, is_adult_meeting: false, load_level: 'middels', staff_name: null, staff_id: null },
      { id: 'fa169b32-fa72-4626-8ef7-0121cdafe2bf', name: 'LEDSAGERMØTE', time_start: '09:20:00', time_end: '10:00:00', location: 'Kongens Utsikt', notes: null, day_of_week: 2, group_name: null, target_child: null, is_adult_meeting: true, load_level: null, staff_name: null, staff_id: null },
      { id: 'e27950ca-2c41-4b57-9f99-cabb79aabd27', name: 'OPPFØLGINGSSAMTALE', time_start: '10:05:00', time_end: '10:50:00', location: null, notes: 'Utsatt fra mandag pga. sykdom', day_of_week: 2, group_name: null, target_child: 'Alice', is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: 'd0fa89ee-4e04-4953-9e59-c7d56b2de95f', name: 'AKTIVITETSROM 1', time_start: '10:15:00', time_end: '11:15:00', location: null, notes: null, day_of_week: 2, group_name: 'gul', target_child: null, is_adult_meeting: false, load_level: 'middels', staff_name: null, staff_id: null },
      { id: 'e7e663a2-a2e8-4d92-9487-4c9deff715a1', name: 'SKOLE', time_start: '10:15:00', time_end: '11:15:00', location: null, notes: null, day_of_week: 2, group_name: 'blå', target_child: null, is_adult_meeting: false, load_level: 'lav', staff_name: null, staff_id: null },
      { id: '596dd045-461a-4d77-aed7-9aa6069152c3', name: 'GYMSAL', time_start: '11:30:00', time_end: '11:50:00', location: 'Avslutning', notes: null, day_of_week: 2, group_name: null, target_child: null, is_adult_meeting: false, load_level: 'høy', staff_name: null, staff_id: null },
      { id: 'af94d62a-7db9-4f08-9f22-77afbfd790f3', name: 'GOD TUR HJEM! 🎉', time_start: '13:00:00', time_end: '14:00:00', location: null, notes: null, day_of_week: 2, group_name: null, target_child: null, is_adult_meeting: false, load_level: null, staff_name: null, staff_id: null },
    ],
    fritid: [],
  },
];

// ─── Public map ──────────────────────────────────────────────────────────────

export const STATIC_WEEKS: Record<string, TimeplanDay[]> = {
  '2026-05-18': hydrate(WEEK_2026_05_18),
  '2026-05-25': hydrate(WEEK_2026_05_25),
};
