// Home page content. Practice areas live in src/content/alanlar.

// unit: g = days, h = weeks, a = months. Confirm each period and article with the firm before launch.
export const deadlines = [
  { act: 'Ödeme emrine itiraz', n: 7, unit: 'g', label: '7 gün', law: 'İİK m. 62' },
  { act: 'Kambiyo takibine itiraz', n: 5, unit: 'g', label: '5 gün', law: 'İİK m. 168' },
  { act: 'İcra işlemine şikâyet', n: 7, unit: 'g', label: '7 gün', law: 'İİK m. 16' },
  { act: 'İstinaf başvurusu', n: 2, unit: 'h', label: '2 hafta', law: 'HMK m. 345' },
  { act: 'Temyiz başvurusu', n: 1, unit: 'a', label: '1 ay', law: 'HMK m. 361' },
  { act: 'İptal davası', n: 60, unit: 'g', label: '60 gün', law: 'İYUK m. 7' },
  { act: 'İşe iade için arabulucuya başvuru', n: 1, unit: 'a', label: '1 ay', law: 'İş K. m. 20' },
  { act: 'Kat malikleri kurulu kararının iptali', n: 1, unit: 'a', label: '1 ay', law: 'KMK m. 33' },
] as const;
