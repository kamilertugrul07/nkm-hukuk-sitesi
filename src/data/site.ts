// Firm details used across the site. Phones belong to each attorney (below); the e-mail is shared.
export const site = {
  name: 'NKM Hukuk Bürosu',
  url: 'https://nkmhukuk.com',
  email: 'bilgi@nkmhukuk.com',
  city: 'Alanya / Antalya',
  address: 'Saray Mah. Yunus Emre Cad. Neslihan Apt. No: 21 Daire: 2, 07400 Alanya / Antalya',
  mapsHref: 'https://maps.app.goo.gl/6De18V1hXrphCiN87',
  lawyers: ['Av. Niyazi Kağan Mısırlıoğlu', 'Av. Kamil Ertuğrul Mısırlıoğlu'],
};

// The attorneys. The notary needs name, bar and number; the about page shows the rest.
// Values in [brackets] are placeholders until the firm confirms them. Add `photo` (an imported image) when available.
export const attorneys = [
  {
    name: 'Av. Niyazi Kağan Mısırlıoğlu', initials: 'NKM', bar: 'Antalya Barosu', sicil: '8348',
    education: 'İstanbul Medipol Üniversitesi', languages: 'Türkçe',
    phone: '0535 056 77 89', phoneHref: 'tel:+905350567789', whatsapp: 'https://wa.me/905350567789',
  },
  {
    name: 'Av. Kamil Ertuğrul Mısırlıoğlu', initials: 'KEM', bar: 'İstanbul 1 Barosu', sicil: '94622',
    education: 'Marmara Üniversitesi', languages: 'Türkçe, İngilizce, Rusça (A1)',
    phone: '0543 240 60 06', phoneHref: 'tel:+905432406006', whatsapp: 'https://wa.me/905432406006',
  },
];

export const hours = 'Hafta içi 09.00 – 18.00';

// Where the contact form's mail fallback is addressed.
export const formRecipients = site.email;

// The approved menu; the home page is reached through the logo.
export const nav = [
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/calisma-alanlari', label: 'Çalışma Alanları' },
  { href: '/dilekce-ornekleri', label: 'Dilekçe Örnekleri' },
  { href: '/vekalet', label: 'Vekalet' },
  { href: '/makaleler', label: 'Makaleler' },
  { href: '/#iletisim', label: 'İletişim' },
];
