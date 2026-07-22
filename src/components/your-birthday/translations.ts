/**
 * Local translations for the "Your Birthday" experience.
 *
 * This page manages its own locale state independently of next-intl so it can
 * toggle between Arabic and English without a route change. Keys are extracted
 * from `your-birthday-view.tsx`.
 */

export const translations = {
  ar: {
    loading: {
      loading: 'جارٍ التحميل',
    },
    nav: {
      back: 'رجوع',
      top: 'العودة للأعلى',
      brand: 'Your Birthday',
      // Label shown on the language toggle button (the language the user will switch TO)
      langToggle: 'English',
    },
    hero: {
      tagline: 'أدوات الحفلات وتجهيزها',
      title1: 'عيد ميلادك',
      subtitle:
        'منصة تأجير أدوات الحفلات وأعياد الميلاد وتجهيزها — رقصات مضيئة، أنظمة صوت، إضاءة، ديكور، والمزيد',
      cta1: 'احجز الباقة المميزة',
      cta2: 'استكشف الباقات',
      // Words cycled through by the TextScramble effect on the hero title
      scrambleWords: ['احتفل معنا', 'يومك المميز', 'بأبهى حلة', 'عيد ميلادك'],
    },
    services: {
      title: 'خدماتنا',
      item1: {
        title: 'تصميم الكيك',
        desc: 'كيك عيد ميلاد مخصص بتصاميم فنية فاخرة تناسب ثيم حفللك.',
      },
      item2: {
        title: 'تنسيق البالونات',
        desc: 'أقواس وتنسيقات بالونات عضوية بألوان وأشكال مبتكرة.',
      },
      item3: {
        title: 'الصوت والإضاءة',
        desc: 'أنظمة صوت احترافية وإضاءة مسرح ملونة تخلق أجواء احتفالية.',
      },
    },
    packages: {
      title: 'باقاتنا',
      popular: 'الأكثر طلباً',
      currency: 'د.ك / يوم',
      cta: 'احجز الآن',
      basic: {
        name: 'الباقة الأساسية',
        feature1: 'تنسيق بالونات أساسي',
        feature2: 'كيك عيد ميلاد صغير',
        feature3: 'إضاءة احتفالية',
        feature4: 'تصوير فوتوغرافي لمدة ساعتين',
      },
      premium: {
        name: 'الباقة المميزة',
        feature1: 'قوس بالونات عضوي فاخر',
        feature2: 'كيك تصميم مخصص',
        feature3: 'نظام صوت احترافي',
        feature4: 'تصوير فوتوغرافي لمدة ٤ ساعات',
      },
      luxury: {
        name: 'الباقة الفاخرة',
        feature1: 'تنسيق متكامل للمكان',
        feature2: 'كيك متعدد الطبقات بتصميم خاص',
        feature3: 'نظام صوت وإضاءة احترافي',
        feature4: 'تصوير فوتوغرافي وفيديو طوال الحفل',
      },
    },
    gallery: {
      title: 'معرض الأعمال',
      // Decorative prefix shown on each gallery tile (kept identical across locales)
      expPrefix: 'EXP // 0',
      items: [
        'قوس البالونات العضوي',
        'تنسيق منصة الكيك',
        'إضاءة المسرح الملونة',
        'طاولات الأكريليك الشفافة',
        'كراسي المعازيم الفاخرة',
        'بوفيه الحلويات الأنيق',
        'كتابة النيون المخصصة',
        'تغطية فوتوغرافية كاملة',
      ],
    },
    testimonials: {
      title: 'آراء عملائنا',
      item1: {
        name: 'نورة العنزي',
        role: 'حفل عيد ميلاد ٣٠',
        text:
          'تجربة استثنائية من البداية للنهاية. التفاصيل كانت مذهلة والتنظيم احترافي بكل معنى الكلمة.',
      },
      item2: {
        name: 'محمد الصباح',
        role: 'حفل عيد ميلاد ابنه',
        text:
          'الفريق متعاون جداً والنتيجة فاقت توقعاتي. الأطفال انبسطوا والأهل انبهروا بالديكور.',
      },
      item3: {
        name: 'سارة المطيري',
        role: 'حفل مفاجأة',
        text:
          'نظّمت لزوجي حفل مفاجأة وكان كل شيء مثالي. الإضاءة والبالونات كانت تحفة فنية حقيقية.',
      },
    },
    cta: {
      title: 'اجعل عيد ميلادك أسطورة',
      subtitle:
        'احجز الآن ودعنا نحوّل يومك إلى تجربة لا تُنسى. فريقنا جاهز لتحقيق رؤيتك بأبهى حلة.',
      button: 'احجز الباقة الفاخرة',
    },
    footer: {
      brand: 'Your Birthday',
      tagline: 'نحوّل أعياد الميلاد إلى تجارب لا تُنسى.',
      rights: `© ${new Date().getFullYear()} جميع الحقوق محفوظة`,
    },
    booking: {
      modalTitle: 'حجز باقة عيد الميلاد',
      selectedPackageLabel: 'الباقة المحددة:',
      close: 'إغلاق',
      submit: 'إرسال طلب الحجز',
      form: {
        name: 'الاسم الكامل',
        phone: 'رقم الهاتف',
        email: 'البريد الإلكتروني (اختياري)',
        location: 'موقع الحفلة (مثال: السالمية)',
        notes: 'طلبات أو ملاحظات إضافية',
      },
      success: {
        title: 'تم استلام طلبك بنجاح',
        body:
          'سيتواصل معك فريق منسقي الحفلات لدينا قريباً لتأكيد تفاصيل حفل عيد ميلادك.',
      },
    },
  },

  en: {
    loading: {
      loading: 'Loading',
    },
    nav: {
      back: 'Back',
      top: 'Back to top',
      brand: 'Your Birthday',
      // Label shown on the language toggle button (the language the user will switch TO)
      langToggle: 'عربي',
    },
    hero: {
      tagline: 'Party Equipment & Setup',
      title1: 'YOUR BIRTHDAY',
      subtitle:
        'Party & birthday equipment rental and setup — LED dance floors, sound systems, lighting, decor, and more',
      cta1: 'Book Premium Package',
      cta2: 'Explore Packages',
      // Words cycled through by the TextScramble effect on the hero title
      scrambleWords: ['CELEBRATE', 'YOUR DAY', 'IN STYLE', 'YOUR BIRTHDAY'],
    },
    services: {
      title: 'Our Services',
      item1: {
        title: 'Cake Design',
        desc: 'Custom luxury birthday cakes with artistic designs to match your party theme.',
      },
      item2: {
        title: 'Balloon Styling',
        desc: 'Organic balloon arches and arrangements in innovative colors and shapes.',
      },
      item3: {
        title: 'Sound & Lighting',
        desc: 'Professional sound systems and colored stage lighting to set the party vibe.',
      },
    },
    packages: {
      title: 'Our Packages',
      popular: 'Most Popular',
      currency: 'KWD / day',
      cta: 'Book Now',
      basic: {
        name: 'Basic Package',
        feature1: 'Basic balloon styling',
        feature2: 'Small birthday cake',
        feature3: 'Festive lighting',
        feature4: '2 hours of photography',
      },
      premium: {
        name: 'Premium Package',
        feature1: 'Luxury organic balloon arch',
        feature2: 'Custom designed cake',
        feature3: 'Professional sound system',
        feature4: '4 hours of photography',
      },
      luxury: {
        name: 'Luxury Package',
        feature1: 'Full venue styling',
        feature2: 'Multi-tier custom cake',
        feature3: 'Pro sound & lighting system',
        feature4: 'Photography & video throughout',
      },
    },
    gallery: {
      title: 'Our Work',
      // Decorative prefix shown on each gallery tile (kept identical across locales)
      expPrefix: 'EXP // 0',
      items: [
        'Organic Balloon Arch',
        'Cake Pedestal Styling',
        'Vivid Stage Lighting',
        'Clear Acrylic Pedestals',
        'Transparent Tiffany Seating',
        'Luxury Dessert Buffet',
        'Custom Neon Signage',
        'Professional Photography',
      ],
    },
    testimonials: {
      title: 'Client Testimonials',
      item1: {
        name: 'Noura Al-Anzi',
        role: '30th Birthday Party',
        text:
          'An exceptional experience from start to finish. The details were stunning and the organization was professional in every sense.',
      },
      item2: {
        name: 'Mohammed Al-Sabah',
        role: "Son's Birthday Party",
        text:
          'The team is very cooperative and the result exceeded my expectations. The kids had a blast and the family was amazed by the decor.',
      },
      item3: {
        name: 'Sarah Al-Mutairi',
        role: 'Surprise Party',
        text:
          'I organized a surprise party for my husband and everything was perfect. The lighting and balloons were a true work of art.',
      },
    },
    cta: {
      title: 'Make Your Birthday Legendary',
      subtitle:
        'Book now and let us turn your day into an unforgettable experience. Our team is ready to bring your vision to life in style.',
      button: 'Book Luxury Package',
    },
    footer: {
      brand: 'Your Birthday',
      tagline: 'We turn birthdays into unforgettable experiences.',
      rights: `© ${new Date().getFullYear()} All Rights Reserved`,
    },
    booking: {
      modalTitle: 'Book Birthday Package',
      selectedPackageLabel: 'Selected Package:',
      close: 'Close',
      submit: 'Submit Reservation Order',
      form: {
        name: 'Full Name',
        phone: 'Phone Number',
        email: 'Email Address (Optional)',
        location: 'Event Location (e.g., Salmiya)',
        notes: 'Additional custom requests',
      },
      success: {
        title: 'Order Received Successfully',
        body:
          'Our party planning coordinators will contact you shortly to finalize details.',
      },
    },
  },
} as const

export type BirthdayLocale = keyof typeof translations
