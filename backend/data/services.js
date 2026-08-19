const SERVICES = {
 cctv: {
    id: "cctv",

    name: {
        en: "CCTV System",
        ms: "Sistem CCTV"
    },

    questions: [

        // ==================================================
        // 1. PROPERTY
        // ==================================================

        {
            id: "property",
            type: "single",

            title: {
                en: "What are you securing?",
                ms: "Apakah yang anda ingin lindungi?"
            },

            description: {
                en: "We will match the CCTV coverage to the type of site.",
                ms: "Kami akan memadankan liputan CCTV dengan jenis tapak."
            },

            options: [
                {
                    value: "home",

                    label: {
                        en: "Home",
                        ms: "Rumah"
                    },

                    description: {
                        en: "Landed house, apartment or residential property.",
                        ms: "Rumah bertanah, pangsapuri atau kediaman."
                    }
                },

                {
                    value: "business",

                    label: {
                        en: "Business",
                        ms: "Perniagaan"
                    },

                    description: {
                        en: "Shop, office or commercial premises.",
                        ms: "Kedai, pejabat atau premis komersial."
                    }
                },

                {
                    value: "warehouse",

                    label: {
                        en: "Warehouse / Factory",
                        ms: "Gudang / Kilang"
                    },

                    description: {
                        en: "Larger warehouse, factory or operational premises.",
                        ms: "Gudang, kilang atau premis operasi yang lebih besar."
                    }
                }
            ]
        },


        // ==================================================
        // 2. CCTV SYSTEM
        // ==================================================

        {
            id: "system",
            type: "single",

            title: {
                en: "Which CCTV system do you prefer?",
                ms: "Sistem CCTV manakah yang anda pilih?"
            },

            description: {
                en: "Choose Wired, Wireless, or select Need Advice if you are unsure.",
                ms: "Pilih Berwayar, Tanpa Wayar, atau Perlukan Nasihat jika anda tidak pasti."
            },

            options: [
                {
                    value: "wired",

                    label: {
                        en: "Wired",
                        ms: "Berwayar"
                    },

                    description: {
                        en: "Stable CCTV connection using network or video cables.",
                        ms: "Sambungan CCTV yang stabil menggunakan kabel rangkaian atau video."
                    }
                },

                {
                    value: "wireless",

                    label: {
                        en: "Wireless",
                        ms: "Tanpa Wayar"
                    },

                    description: {
                        en: "Flexible CCTV installation using a Wi-Fi connection.",
                        ms: "Pemasangan CCTV yang fleksibel menggunakan sambungan Wi-Fi."
                    }
                },

                {
                    value: "advice",

                    label: {
                        en: "Need Advice",
                        ms: "Perlukan Nasihat"
                    },

                    description: {
                        en: "Our team will recommend the most suitable CCTV system.",
                        ms: "Pasukan kami akan mencadangkan sistem CCTV yang paling sesuai."
                    }
                }
            ]
        },


        // ==================================================
        // 3. COVERAGE
        // ==================================================

        {
            id: "coverage",
            type: "single",

            title: {
                en: "How many areas need coverage?",
                ms: "Berapa banyak kawasan yang memerlukan liputan?"
            },

            description: {
                en: "An area can be an entrance, room, driveway or another viewing point.",
                ms: "Kawasan boleh terdiri daripada pintu masuk, bilik, laluan kenderaan atau titik pandangan lain."
            },

            options: [
                {
                    value: "1_4",

                    label: {
                        en: "1–4 Areas",
                        ms: "1–4 Kawasan"
                    },

                    description: {
                        en: "Compact CCTV coverage.",
                        ms: "Liputan CCTV yang padat."
                    }
                },

                {
                    value: "5_8",

                    label: {
                        en: "5–8 Areas",
                        ms: "5–8 Kawasan"
                    },

                    description: {
                        en: "Standard property coverage.",
                        ms: "Liputan premis standard."
                    }
                },

                {
                    value: "9_16",

                    label: {
                        en: "9–16 Areas",
                        ms: "9–16 Kawasan"
                    },

                    description: {
                        en: "Extended CCTV coverage.",
                        ms: "Liputan CCTV yang lebih meluas."
                    }
                },

                {
                    value: "16_plus",

                    label: {
                        en: "16+ Areas",
                        ms: "16+ Kawasan"
                    },

                    description: {
                        en: "Large site CCTV coverage.",
                        ms: "Liputan CCTV untuk tapak yang besar."
                    }
                }
            ]
        },


        // ==================================================
        // 4. NIGHT VISION MODE
        // ==================================================

        {
            id: "priority",
            type: "single",

            title: {
                en: "What night vision mode do you prefer?",
                ms: "Mod penglihatan malam manakah yang anda pilih?"
            },

            description: {
                en: "Choose the camera lighting technology that suits your environment.",
                ms: "Pilih teknologi pencahayaan kamera yang sesuai dengan persekitaran anda."
            },

            options: [
                {
                    value: "full_colour",

                    label: {
                        en: "Full Colour",
                        ms: "Warna Penuh"
                    },

                    description: {
                        en: "Provides colour video during low-light conditions.",
                        ms: "Memberikan video berwarna dalam keadaan kurang cahaya."
                    }
                },

                {
                    value: "dual_light",

                    label: {
                        en: "Dual Light",
                        ms: "Dual Light"
                    },

                    description: {
                        en: "Combines infrared and warm light for smart night monitoring.",
                        ms: "Menggabungkan inframerah dan lampu putih untuk pemantauan malam yang lebih pintar."
                    }
                },

                {
                    value: "ir",

                    label: {
                        en: "IR Night Vision",
                        ms: "Penglihatan Malam IR"
                    },

                    description: {
                        en: "Infrared night vision for monitoring in complete darkness.",
                        ms: "Penglihatan malam inframerah untuk pemantauan dalam keadaan gelap."
                    }
                }
            ]
        },


        // ==================================================
        // 5. CAMERA QUANTITY
        // ==================================================

        {
            id: "camera_quantity",
            type: "counter",

            title: {
                en: "How many cameras do you need?",
                ms: "Berapakah bilangan kamera yang diperlukan?"
            },

            description: {
                en: "Set the quantity for indoor and outdoor areas.",
                ms: "Tetapkan jumlah kamera untuk kawasan dalam dan luar bangunan."
            },

            min_value: 0,
            max_value: 100,
            step_value: 1,

            required: true,

            counters: [
                {
                    id: "indoor",

                    label: {
                        en: "Indoor Camera",
                        ms: "Kamera Dalam"
                    },

                    description: {
                        en: "Suitable for rooms, living spaces and offices.",
                        ms: "Sesuai untuk bilik, ruang tamu dan pejabat."
                    },

                    min_value: 0,
                    max_value: 100,
                    step_value: 1
                },

                {
                    id: "outdoor",

                    label: {
                        en: "Outdoor Camera",
                        ms: "Kamera Luar"
                    },

                    description: {
                        en: "Suitable for gates, yards, entrances and parking areas.",
                        ms: "Sesuai untuk pagar, halaman, pintu masuk dan kawasan parkir."
                    },

                    min_value: 0,
                    max_value: 100,
                    step_value: 1
                }
            ]
        },


        // ==================================================
        // 6. CAMERA RESOLUTION
        // ==================================================

        {
            id: "resolution",
            type: "single",

            title: {
                en: "What camera resolution do you prefer?",
                ms: "Apakah resolusi kamera pilihan anda?"
            },

            description: {
                en: "Choose the video resolution based on the level of detail you need.",
                ms: "Pilih resolusi video berdasarkan tahap perincian yang anda perlukan."
            },

            options: [
                {
                    value: "1080p_2mp",

                    label: {
                        en: "1080p Full HD (2MP)",
                        ms: "1080p Full HD (2MP)"
                    },

                    description: {
                        en: "Clear Full HD video suitable for standard monitoring.",
                        ms: "Video Full HD yang jelas dan sesuai untuk pemantauan standard."
                    }
                },

                {
                    value: "3k_5mp",

                    label: {
                        en: "3K (5MP)",
                        ms: "3K (5MP)"
                    },

                    description: {
                        en: "Higher detail for improved identification and monitoring.",
                        ms: "Perincian lebih tinggi untuk pengecaman dan pemantauan yang lebih baik."
                    }
                },

                {
                    value: "4k_8mp",

                    label: {
                        en: "4K Ultra HD (8MP)",
                        ms: "4K Ultra HD (8MP)"
                    },

                    description: {
                        en: "Ultra-high detail for larger areas and clearer identification.",
                        ms: "Perincian ultra tinggi untuk kawasan yang lebih besar dan pengecaman yang lebih jelas."
                    }
                }
            ]
        },


        // ==================================================
        // 7. CAMERA FEATURES
        // ==================================================

        {
            id: "technical_features",
            type: "single",

            title: {
                en: "Which camera feature do you need?",
                ms: "Ciri kamera manakah yang anda perlukan?"
            },

            description: {
                en: "Choose the feature that is most important for your CCTV system.",
                ms: "Pilih ciri yang paling penting untuk sistem CCTV anda."
            },

            options: [
                {
                    value: "audio",

                    label: {
                        en: "Audio",
                        ms: "Audio"
                    },

                    description: {
                        en: "Record audio together with CCTV video.",
                        ms: "Merakam audio bersama video CCTV."
                    }
                },

                {
                    value: "two_way_talk",

                    label: {
                        en: "2-Way Talk",
                        ms: "Komunikasi 2 Hala"
                    },

                    description: {
                        en: "Listen and speak through the camera.",
                        ms: "Dengar dan bercakap melalui kamera."
                    }
                },

                {
                    value: "audio_alarm",

                    label: {
                        en: "Audio + Alarm",
                        ms: "Audio + Penggera"
                    },

                    description: {
                        en: "Audio capability combined with an active alarm function.",
                        ms: "Keupayaan audio bersama fungsi penggera aktif."
                    }
                },

                {
                    value: "ai_detection",

                    label: {
                        en: "AI Detection",
                        ms: "Pengesanan AI"
                    },

                    description: {
                        en: "Detect humans or vehicles for smarter monitoring alerts.",
                        ms: "Mengesan manusia atau kenderaan untuk amaran pemantauan yang lebih pintar."
                    }
                }
            ]
        },


        // ==================================================
        // 8. ACCESSORIES
        // ==================================================

        {
            id: "accessories",
            type: "multi",

            title: {
                en: "Any additional accessories needed?",
                ms: "Adakah aksesori tambahan diperlukan?"
            },

            description: {
                en: "Select extra equipment. You can select multiple options.",
                ms: "Pilih peralatan tambahan. Anda boleh memilih lebih daripada satu pilihan."
            },

            options: [
                {
                    value: "monitor",

                    label: {
                        en: "TV / Screen Monitor",
                        ms: "Monitor TV / Skrin"
                    },

                    description: {
                        en: "Dedicated display screen for live CCTV monitoring.",
                        ms: "Skrin khas untuk pemantauan CCTV secara langsung."
                    }
                },

                {
                    value: "ups",

                    label: {
                        en: "UPS (Battery Backup)",
                        ms: "UPS (Bateri Sandaran)"
                    },

                    description: {
                        en: "Keeps the CCTV system running during power outages.",
                        ms: "Memastikan sistem CCTV terus beroperasi semasa gangguan elektrik."
                    }
                },

                {
                    value: "rack",

                    label: {
                        en: "4U Server Rack Cabinet",
                        ms: "Kabinet Rack Server 4U"
                    },

                    description: {
                        en: "Neatly stores and protects NVR/DVR and network equipment.",
                        ms: "Menyimpan dan melindungi NVR/DVR serta peralatan rangkaian dengan kemas."
                    }
                },

                {
                    value: "none",

                    label: {
                        en: "None",
                        ms: "Tiada"
                    },

                    description: {
                        en: "No additional accessories are required.",
                        ms: "Tiada aksesori tambahan diperlukan."
                    }
                }
            ]
        },


        // ==================================================
        // 9. INTERNET ACCESS
        // ==================================================

        {
            id: "internet",
            type: "single",

            title: {
                en: "Is internet access available at the site?",
                ms: "Adakah sambungan internet tersedia di lokasi?"
            },

            description: {
                en: "Internet is required for remote viewing and mobile app access.",
                ms: "Internet diperlukan untuk pemantauan jarak jauh dan akses aplikasi mudah alih."
            },

            options: [
                {
                    value: "yes",

                    label: {
                        en: "Yes, Internet Available",
                        ms: "Ya, Internet Tersedia"
                    },

                    description: {
                        en: "Enables remote viewing using a mobile app.",
                        ms: "Membolehkan pemantauan jarak jauh menggunakan aplikasi mudah alih."
                    }
                },

                {
                    value: "no",

                    label: {
                        en: "No Internet",
                        ms: "Tiada Internet"
                    },

                    description: {
                        en: "The system can use local recording without remote viewing.",
                        ms: "Sistem boleh menggunakan rakaman setempat tanpa pemantauan jarak jauh."
                    }
                }
            ]
        },


        // ==================================================
        // 10. BUDGET
        // ==================================================

        {
            id: "budget",
            type: "single",

            title: {
                en: "What is your estimated budget?",
                ms: "Apakah anggaran bajet anda?"
            },

            description: {
                en: "Choose an estimated budget range so we can recommend a suitable CCTV package.",
                ms: "Pilih julat anggaran bajet supaya kami boleh mencadangkan pakej CCTV yang sesuai."
            },

            options: [
                {
                    value: "below_1000",

                    label: {
                        en: "Below RM1,000",
                        ms: "Bawah RM1,000"
                    },

                    description: {
                        en: "Looking for a basic and cost-effective CCTV solution.",
                        ms: "Mencari penyelesaian CCTV asas dan menjimatkan."
                    }
                },

                {
                    value: "1000_3000",

                    label: {
                        en: "RM1,000 – RM3,000",
                        ms: "RM1,000 – RM3,000"
                    },

                    description: {
                        en: "Suitable for a standard home or small business CCTV setup.",
                        ms: "Sesuai untuk pemasangan CCTV rumah standard atau perniagaan kecil."
                    }
                },

                {
                    value: "3000_5000",

                    label: {
                        en: "RM3,000 – RM5,000",
                        ms: "RM3,000 – RM5,000"
                    },

                    description: {
                        en: "Suitable for larger coverage and additional camera features.",
                        ms: "Sesuai untuk liputan yang lebih besar dan ciri kamera tambahan."
                    }
                },

                {
                    value: "5000_plus",

                    label: {
                        en: "RM5,000 and Above",
                        ms: "RM5,000 dan Ke Atas"
                    },

                    description: {
                        en: "Suitable for larger or higher-specification CCTV systems.",
                        ms: "Sesuai untuk sistem CCTV yang lebih besar atau berspesifikasi tinggi."
                    }
                },

                {
                    value: "not_sure",

                    label: {
                        en: "Not Sure / Need Advice",
                        ms: "Tidak Pasti / Perlukan Nasihat"
                    },

                    description: {
                        en: "Tell us your requirements and we will recommend a suitable package.",
                        ms: "Beritahu keperluan anda dan kami akan mencadangkan pakej yang sesuai."
                    }
                }
            ]
        },


        // ==================================================
        // 11. SITE VISIT
        // ==================================================

        {
            id: "site_visit",
            type: "single",

            title: {
                en: "Do you require a site visit?",
                ms: "Adakah anda memerlukan lawatan tapak?"
            },

            description: {
                en: "Schedule an on-site assessment by our technical team.",
                ms: "Jadualkan pemeriksaan tapak oleh pasukan teknikal kami."
            },

            options: [
                {
                    value: "yes",

                    label: {
                        en: "Yes, Request Site Visit",
                        ms: "Ya, Perlukan Lawatan Tapak"
                    },

                    description: {
                        en: "Our team will inspect the installation area, wiring and camera locations.",
                        ms: "Pasukan kami akan memeriksa kawasan pemasangan, pendawaian dan lokasi kamera."
                    }
                },

                {
                    value: "no",

                    label: {
                        en: "No, Direct Quotation",
                        ms: "Tidak, Sebut Harga Terus"
                    },

                    description: {
                        en: "Proceed with a quotation based on the information provided.",
                        ms: "Teruskan dengan sebut harga berdasarkan maklumat yang diberikan."
                    }
                }
            ]
        }

    ]
},

  alarm: {
    id: "alarm",

    name: {
        en: "Alarm System",
        ms: "Sistem Penggera"
    },

    questions: [

        // ==================================================
        // 1. PROPERTY TYPE
        // ==================================================

        {
            id: "property_type",
            type: "single",

            title: {
                en: "Property Type",
                ms: "Jenis Premis"
            },

            description: {
                en: "Choose the type of property you want to protect.",
                ms: "Pilih jenis premis yang ingin anda lindungi."
            },

            required: true,

            options: [
                {
                    value: "home",

                    label: {
                        en: "Home",
                        ms: "Rumah"
                    },

                    description: {
                        en: "Residential house, terrace, bungalow or apartment.",
                        ms: "Rumah kediaman, teres, banglo atau apartmen."
                    }
                },

                {
                    value: "shop",

                    label: {
                        en: "Shop",
                        ms: "Kedai"
                    },

                    description: {
                        en: "Shop lot, retail or business space.",
                        ms: "Kedai, lot perniagaan atau ruang runcit."
                    }
                },

                {
                    value: "office",

                    label: {
                        en: "Office",
                        ms: "Pejabat"
                    },

                    description: {
                        en: "Office, workspace or meeting rooms.",
                        ms: "Pejabat, ruang kerja atau bilik mesyuarat."
                    }
                },

                {
                    value: "factory",

                    label: {
                        en: "Warehouse / Factory",
                        ms: "Gudang / Kilang"
                    },

                    description: {
                        en: "Warehouse, factory or large operational premises.",
                        ms: "Gudang, kilang atau premis operasi besar."
                    }
                }
            ]
        },


        // ==================================================
        // 2. PROPERTY CONDITION
        // ==================================================

        {
            id: "property_condition",
            type: "single",

            title: {
                en: "Property Condition",
                ms: "Keadaan Premis"
            },

            description: {
                en: "Choose the current condition of your property.",
                ms: "Pilih keadaan semasa premis anda."
            },

            required: true,

            options: [
                {
                    value: "under_construction",

                    label: {
                        en: "Under Construction",
                        ms: "Dalam Pembinaan"
                    },

                    description: {
                        en: "Suitable for early planning and cabling installation.",
                        ms: "Sesuai untuk perancangan awal dan pemasangan pendawaian."
                    }
                },

                {
                    value: "completed",

                    label: {
                        en: "Completed",
                        ms: "Siap Bina"
                    },

                    description: {
                        en: "Installation for a completed home or premises.",
                        ms: "Pemasangan untuk rumah atau premis yang telah siap."
                    }
                }
            ]
        },


        // ==================================================
        // 3. ALARM SYSTEM TYPE
        // ==================================================

        {
            id: "alarm_type",
            type: "single",

            title: {
                en: "Alarm System Type",
                ms: "Jenis Sistem Penggera"
            },

            description: {
                en: "Choose the alarm system type that best suits your property.",
                ms: "Pilih jenis sistem penggera yang paling sesuai untuk premis anda."
            },

            required: true,

            options: [
                {
                    value: "wired",

                    label: {
                        en: "Wired",
                        ms: "Berwayar"
                    },

                    description: {
                        en: "Stable cable connection suitable for permanent installations.",
                        ms: "Sambungan kabel yang stabil dan sesuai untuk pemasangan tetap."
                    }
                },

                {
                    value: "wireless",

                    label: {
                        en: "Wireless",
                        ms: "Tanpa Wayar"
                    },

                    description: {
                        en: "Flexible installation with minimal wiring and disruption.",
                        ms: "Pemasangan fleksibel dengan pendawaian dan gangguan minimum."
                    }
                },

                {
                    value: "hybrid",

                    label: {
                        en: "Hybrid",
                        ms: "Hibrid"
                    },

                    description: {
                        en: "A combination of wired and wireless alarm protection.",
                        ms: "Gabungan perlindungan penggera berwayar dan tanpa wayar."
                    }
                }
            ]
        },


        // ==================================================
        // 4. NUMBER OF SENSORS
        // ==================================================

        {
            id: "sensor_quantity",
            type: "counter",

            title: {
                en: "Number of Sensors",
                ms: "Bilangan Sensor"
            },

            description: {
                en: "Select the number of sensors required for each area.",
                ms: "Pilih bilangan sensor yang diperlukan bagi setiap kawasan."
            },

            required: false,

            counters: [
                {
                    id: "door",

                    label: {
                        en: "Door",
                        ms: "Pintu"
                    },

                    description: {
                        en: "Sensors for main doors and other access doors.",
                        ms: "Sensor untuk pintu utama dan pintu akses lain."
                    },

                    min_value: 0,
                    max_value: 100,
                    step_value: 1
                },

                {
                    id: "window",

                    label: {
                        en: "Window",
                        ms: "Tingkap"
                    },

                    description: {
                        en: "Sensors for windows that can be opened.",
                        ms: "Sensor untuk tingkap yang boleh dibuka."
                    },

                    min_value: 0,
                    max_value: 100,
                    step_value: 1
                },

                {
                    id: "sliding",

                    label: {
                        en: "Sliding Door",
                        ms: "Pintu Gelangsar"
                    },

                    description: {
                        en: "Sensors for sliding doors or patio doors.",
                        ms: "Sensor untuk pintu gelangsar atau pintu patio."
                    },

                    min_value: 0,
                    max_value: 100,
                    step_value: 1
                }
            ]
        },


        // ==================================================
        // 5. INTERNET ACCESS
        // ==================================================

        {
            id: "internet_access",
            type: "single",

            title: {
                en: "Internet Access",
                ms: "Akses Internet"
            },

            description: {
                en: "Is a stable internet connection available at your property?",
                ms: "Adakah sambungan internet yang stabil tersedia di premis anda?"
            },

            required: true,

            options: [
                {
                    value: "yes",

                    label: {
                        en: "Yes, Internet Is Available",
                        ms: "Ya, Internet Tersedia"
                    },

                    description: {
                        en: "A stable internet connection is available for app access and remote notifications.",
                        ms: "Sambungan internet yang stabil tersedia untuk akses aplikasi dan notifikasi jarak jauh."
                    }
                },

                {
                    value: "no",

                    label: {
                        en: "No Internet Available",
                        ms: "Tiada Internet"
                    },

                    description: {
                        en: "There is currently no internet connection at the property.",
                        ms: "Buat masa ini tiada sambungan internet di premis."
                    }
                },

                {
                    value: "need_setup",

                    label: {
                        en: "Need Internet Setup",
                        ms: "Perlu Pemasangan Internet"
                    },

                    description: {
                        en: "Internet access may need to be arranged or installed.",
                        ms: "Akses internet mungkin perlu diatur atau dipasang."
                    }
                }
            ]
        },


        // ==================================================
        // 6. CONTROL METHOD
        // ==================================================

        {
            id: "alarm_accessories",
            type: "single",

            title: {
                en: "Control Method",
                ms: "Kaedah Kawalan"
            },

            description: {
                en: "Choose how you would like to control and monitor your alarm system.",
                ms: "Pilih cara anda mahu mengawal dan memantau sistem penggera anda."
            },

            required: true,

            options: [
                {
                    value: "standard",

                    label: {
                        en: "Standard Control",
                        ms: "Kawalan Biasa"
                    },

                    description: {
                        en: "Control the alarm system using standard controls or a remote.",
                        ms: "Kawal sistem penggera menggunakan kawalan biasa atau remote."
                    }
                },

                {
                    value: "app",

                    label: {
                        en: "Mobile App Control",
                        ms: "Kawalan Aplikasi Mudah Alih"
                    },

                    description: {
                        en: "Control and monitor the system through a mobile app and receive remote notifications.",
                        ms: "Kawal dan pantau sistem melalui aplikasi mudah alih serta terima notifikasi jarak jauh."
                    }
                }
            ]
        },


        // ==================================================
        // 7. SITE VISIT
        // ==================================================

        {
            id: "site_visit",
            type: "single",

            title: {
                en: "Site Visit",
                ms: "Lawatan Tapak"
            },

            description: {
                en: "Do you require a site visit before the final quotation?",
                ms: "Adakah anda memerlukan lawatan tapak sebelum sebut harga akhir?"
            },

            required: true,

            options: [
                {
                    value: "yes",

                    label: {
                        en: "Yes",
                        ms: "Ya"
                    },

                    description: {
                        en: "Our team will assess the site before preparing the final quotation.",
                        ms: "Pasukan kami akan menilai tapak sebelum menyediakan sebut harga akhir."
                    }
                },

                {
                    value: "no",

                    label: {
                        en: "No",
                        ms: "Tidak"
                    },

                    description: {
                        en: "Proceed with recommendations based on the information you provided.",
                        ms: "Teruskan dengan cadangan berdasarkan maklumat yang anda berikan."
                    }
                }
            ]
        }

    ]
},

    access: {
    id: "access",

    name: {
        en: "Door Access",
        ms: "Door Access"
    },

    questions: [

        {
            id: "site",
            type: "single",

            title: {
                en: "Where is access control needed?",
                ms: "Di manakah kawalan akses diperlukan?"
            },

            description: {
                en: "Select the type of premises.",
                ms: "Pilih jenis premis untuk pemasangan."
            },

            options: [
                {
                    value: "home",
                    label: {
                        en: "Home",
                        ms: "Rumah"
                    },
                    description: {
                        en: "Main door, gate or rooms",
                        ms: "Pintu utama, pagar atau bilik"
                    }
                },
                {
                    value: "office",
                    label: {
                        en: "Office",
                        ms: "Pejabat"
                    },
                    description: {
                        en: "Staff and meeting areas",
                        ms: "Kawasan staf dan mesyuarat"
                    }
                },
                {
                    value: "retail",
                    label: {
                        en: "Retail / Factory",
                        ms: "Kedai / Kilang"
                    },
                    description: {
                        en: "Restricted commercial zones",
                        ms: "Zon komersial terhad"
                    }
                }
            ]
        },

        {
            id: "doors",
            type: "single",

            title: {
                en: "How many doors need control?",
                ms: "Berapa banyak pintu perlukan kawalan?"
            },

            description: {
                en: "Estimate the total number of doors.",
                ms: "Anggarkan jumlah pintu yang terlibat."
            },

            options: [
                {
                    value: "1",
                    label: {
                        en: "1 Door",
                        ms: "1 Pintu"
                    },
                    description: {
                        en: "Single controlled entry",
                        ms: "Satu kemasukan terkawal"
                    }
                },
                {
                    value: "2_4",
                    label: {
                        en: "2–4 Doors",
                        ms: "2–4 Pintu"
                    },
                    description: {
                        en: "Small multi-door setup",
                        ms: "Sistem berbilang pintu kecil"
                    }
                },
                {
                    value: "5_plus",
                    label: {
                        en: "5+ Doors",
                        ms: "5+ Pintu"
                    },
                    description: {
                        en: "Centralised access management",
                        ms: "Pengurusan akses berpusat"
                    }
                }
            ]
        },

        {
            id: "door_type",
            type: "single",

            title: {
                en: "What is the door type?",
                ms: "Apakah jenis pintu anda?"
            },

            description: {
                en: "Select how your door opens.",
                ms: "Pilih cara pintu anda dibuka."
            },

            options: [
                {
                    value: "swing",
                    label: {
                        en: "Swing Door",
                        ms: "Pintu Ayun (Swing)"
                    },
                    description: {
                        en: "Standard push/pull door",
                        ms: "Pintu biasa yang ditolak atau ditarik"
                    }
                },
                {
                    value: "sliding",
                    label: {
                        en: "Sliding Door",
                        ms: "Pintu Gelangsar (Sliding)"
                    },
                    description: {
                        en: "Door that slides horizontally",
                        ms: "Pintu yang ditolak ke tepi"
                    }
                }
            ]
        },

        {
            id: "door_material",
            type: "single",

            title: {
                en: "What is the door material?",
                ms: "Apakah material pintu tersebut?"
            },

            description: {
                en: "Select the main material of the door.",
                ms: "Pilih bahan utama binaan pintu."
            },

            options: [
                {
                    value: "wood",
                    label: {
                        en: "Wooden",
                        ms: "Kayu"
                    },
                    description: {
                        en: "Solid or hollow wooden doors",
                        ms: "Pintu kayu pepejal atau berongga"
                    }
                },
                {
                    value: "metal",
                    label: {
                        en: "Metal / Aluminium",
                        ms: "Besi / Aluminium"
                    },
                    description: {
                        en: "Steel doors, grilles or fire doors",
                        ms: "Pintu logam, gril atau rintangan api"
                    }
                },
                {
                    value: "framed_glass",
                    label: {
                        en: "Framed Glass",
                        ms: "Kaca (Berbingkai)"
                    },
                    description: {
                        en: "Glass door with aluminium frame",
                        ms: "Pintu kaca dengan bingkai aluminium"
                    }
                },
                {
                    value: "frameless_glass",
                    label: {
                        en: "Frameless Glass",
                        ms: "Kaca (Tanpa Bingkai)"
                    },
                    description: {
                        en: "Full tempered glass doors",
                        ms: "Pintu kaca penuh (Tempered glass)"
                    }
                }
            ]
        },

        {
            id: "staff",
            type: "number",

            title: {
                en: "How many staff / users?",
                ms: "Berapakah bilangan staf / pengguna?"
            },

            description: {
                en: "Enter the estimated number of users for this system.",
                ms: "Masukkan anggaran bilangan pengguna sistem ini."
            },

            placeholder: {
                en: "e.g. 25",
                ms: "cth. 25"
            },

            unit: "users",

            min_value: 1,
            max_value: 10000,
            step_value: 1,

            required: true
        },

        {
            id: "access_method",
            type: "multi",

            title: {
                en: "Preferred entry method?",
                ms: "Kaedah kemasukan pilihan?"
            },

            description: {
                en: "Choose how users will unlock the doors. You can select multiple.",
                ms: "Pilih cara pengguna membuka pintu. Boleh pilih lebih daripada satu."
            },

            options: [
                {
                    value: "card",
                    label: {
                        en: "Card / Tag",
                        ms: "Kad / Tag"
                    },
                    description: {
                        en: "Fast contactless entry",
                        ms: "Kemasukan pantas tanpa sentuh"
                    }
                },
                {
                    value: "fingerprint",
                    label: {
                        en: "Fingerprint",
                        ms: "Cap Jari"
                    },
                    description: {
                        en: "Biometric verification",
                        ms: "Pengesahan biometrik"
                    }
                },
                {
                    value: "face",
                    label: {
                        en: "Face Recognition",
                        ms: "Pengecaman Muka"
                    },
                    description: {
                        en: "Touch-free recognition",
                        ms: "Pengecaman tanpa sentuh"
                    }
                },
                {
                    value: "pin",
                    label: {
                        en: "PIN Code",
                        ms: "Kod PIN"
                    },
                    description: {
                        en: "Keypad access",
                        ms: "Akses pad kekunci"
                    }
                }
            ]
        },

        {
            id: "system",
            type: "single",

            title: {
                en: "System control type?",
                ms: "Jenis kawalan sistem?"
            },

            description: {
                en: "Select how you want to manage the system.",
                ms: "Pilih cara pengurusan akses sistem."
            },

            options: [
                {
                    value: "standalone",
                    label: {
                        en: "Stand Alone",
                        ms: "Stand Alone"
                    },
                    description: {
                        en: "Manage users directly at the door",
                        ms: "Urus kad atau cap jari terus di pintu"
                    }
                },
                {
                    value: "lan",
                    label: {
                        en: "Networked / LAN",
                        ms: "Rangkaian / LAN"
                    },
                    description: {
                        en: "Manage users via PC / Software",
                        ms: "Urus pengguna melalui PC / Perisian"
                    }
                }
            ]
        },

        {
            id: "requirement",
            type: "single",

            title: {
                en: "What is most important?",
                ms: "Apakah yang paling penting?"
            },

            description: {
                en: "Select the key feature you require.",
                ms: "Pilih fungsi utama yang anda perlukan."
            },

            options: [
                {
                    value: "records",
                    label: {
                        en: "Visitor Records",
                        ms: "Rekod Pelawat"
                    },
                    description: {
                        en: "Track entries and exits",
                        ms: "Jejak waktu keluar masuk"
                    }
                },
                {
                    value: "schedule",
                    label: {
                        en: "Time Schedules",
                        ms: "Jadual Masa"
                    },
                    description: {
                        en: "Control when users can enter",
                        ms: "Kawal bila pengguna boleh masuk"
                    }
                },
                {
                    value: "mobile",
                    label: {
                        en: "Mobile Access",
                        ms: "Akses Mudah Alih"
                    },
                    description: {
                        en: "Unlock with a phone",
                        ms: "Buka kunci menggunakan telefon"
                    }
                },
                {
                    value: "integration",
                    label: {
                        en: "Integration",
                        ms: "Integrasi"
                    },
                    description: {
                        en: "Connect with existing door or alarm systems",
                        ms: "Sambung dengan sistem pintu atau penggera sedia ada"
                    }
                }
            ]
        }
    ]
},

   attendance: {
    id: "attendance",

    name: {
        en: "Time Attendance",
        ms: "Sistem Kehadiran"
    },

    questions: [

        // ==================================================
        // 1. WORKPLACE TYPE
        // ==================================================

        {
            id: "site",
            type: "single",

            title: {
                en: "Where will the attendance system be used?",
                ms: "Di manakah sistem kehadiran akan digunakan?"
            },

            description: {
                en: "Select the type of workplace.",
                ms: "Pilih jenis tempat kerja."
            },

            required: true,

            options: [
                {
                    value: "office",
                    label: {
                        en: "Office",
                        ms: "Pejabat"
                    },
                    description: {
                        en: "Office or corporate workplace.",
                        ms: "Pejabat atau tempat kerja korporat."
                    }
                },

                {
                    value: "retail",
                    label: {
                        en: "Retail / Shop",
                        ms: "Kedai / Runcit"
                    },
                    description: {
                        en: "Retail outlet, shop lot or business premises.",
                        ms: "Kedai, lot kedai atau premis perniagaan."
                    }
                },

                {
                    value: "factory",
                    label: {
                        en: "Factory / Warehouse",
                        ms: "Kilang / Gudang"
                    },
                    description: {
                        en: "Factory, warehouse or operational site.",
                        ms: "Kilang, gudang atau tapak operasi."
                    }
                },

                {
                    value: "school",
                    label: {
                        en: "School / Institution",
                        ms: "Sekolah / Institusi"
                    },
                    description: {
                        en: "School, college or other institution.",
                        ms: "Sekolah, kolej atau institusi lain."
                    }
                }
            ]
        },


        // ==================================================
        // 2. NUMBER OF USERS
        // ==================================================

        {
            id: "users",
            type: "number",

            title: {
                en: "How many employees / users?",
                ms: "Berapakah bilangan pekerja / pengguna?"
            },

            description: {
                en: "Enter the estimated number of employees who will use the system.",
                ms: "Masukkan anggaran bilangan pekerja yang akan menggunakan sistem."
            },

            placeholder: {
                en: "e.g. 50",
                ms: "cth. 50"
            },

            unit: {
                en: "users",
                ms: "pengguna"
            },

            min_value: 1,
            max_value: 10000,
            step_value: 1,

            required: true
        },


        // ==================================================
        // 3. ATTENDANCE METHOD
        // ==================================================

        {
            id: "biometric",
            type: "multi",

            title: {
                en: "Preferred Attendance Method",
                ms: "Kaedah Kehadiran Pilihan"
            },

            description: {
                en: "Select one or more attendance methods.",
                ms: "Pilih satu atau lebih kaedah kehadiran."
            },

            required: true,

            options: [
                {
                    value: "fingerprint",
                    label: {
                        en: "Fingerprint",
                        ms: "Cap Jari"
                    },
                    description: {
                        en: "Reliable biometric attendance using fingerprints.",
                        ms: "Kehadiran biometrik menggunakan cap jari."
                    }
                },

                {
                    value: "face",
                    label: {
                        en: "Face Recognition",
                        ms: "Pengecaman Muka"
                    },
                    description: {
                        en: "Fast and contactless attendance using face recognition.",
                        ms: "Kehadiran pantas tanpa sentuhan menggunakan pengecaman muka."
                    }
                },

                {
                    value: "card",
                    label: {
                        en: "Card / RFID",
                        ms: "Kad / RFID"
                    },
                    description: {
                        en: "Simple attendance using an access card or RFID.",
                        ms: "Kehadiran mudah menggunakan kad akses atau RFID."
                    }
                },

                {
                    value: "pin",
                    label: {
                        en: "PIN",
                        ms: "PIN"
                    },
                    description: {
                        en: "Attendance using a personal PIN.",
                        ms: "Kehadiran menggunakan PIN peribadi."
                    }
                }
            ]
        },


        // ==================================================
        // 4. TERMINAL LOCATIONS
        // ==================================================

        {
            id: "terminal_location",
            type: "multi",

            title: {
    en: "Where will the attendance system be installed?",
    ms: "Di manakah sistem kehadiran akan dipasang?"
},

            description: {
    en: "Select one or more locations where the attendance system will be installed.",
    ms: "Pilih satu atau lebih lokasi di mana sistem kehadiran akan dipasang."
},

            required: true,

            options: [
                {
                    value: "main_entrance",
                    label: {
                        en: "Main Entrance",
                        ms: "Pintu Masuk Utama"
                    },
                    description: {
                        en: "Terminal installed at the main entrance.",
                        ms: "Terminal dipasang di pintu masuk utama."
                    }
                },

                {
                    value: "staff_entrance",
                    label: {
                        en: "Staff Entrance",
                        ms: "Pintu Masuk Pekerja"
                    },
                    description: {
                        en: "Terminal installed at the staff entrance.",
                        ms: "Terminal dipasang di pintu masuk pekerja."
                    }
                },

                {
                    value: "office_area",
                    label: {
                        en: "Office Area",
                        ms: "Kawasan Pejabat"
                    },
                    description: {
                        en: "Terminal installed inside the office area.",
                        ms: "Terminal dipasang di dalam kawasan pejabat."
                    }
                },

                {
                    value: "production_area",
                    label: {
                        en: "Production / Working Area",
                        ms: "Kawasan Pengeluaran / Kerja"
                    },
                    description: {
                        en: "Terminal installed near the main working area.",
                        ms: "Terminal dipasang berhampiran kawasan kerja utama."
                    }
                },

                {
                    value: "other",
                    label: {
                        en: "Other Location",
                        ms: "Lokasi Lain"
                    },
                    description: {
                        en: "Another location not listed above.",
                        ms: "Lokasi lain yang tidak disenaraikan."
                    }
                }
            ]
        },


        // ==================================================
        // 5. INTERNET ACCESS
        // ==================================================

        {
            id: "internet_access",
            type: "single",

            title: {
                en: "Internet Access",
                ms: "Akses Internet"
            },

            description: {
                en: "Is internet access available at the location where the attendance system will be installed?",
                ms: "Adakah akses internet tersedia di lokasi sistem kehadiran akan dipasang?"
            },

            required: true,

            options: [
                {
                    value: "yes",
                    label: {
                        en: "Yes, Internet Is Available",
                        ms: "Ya, Internet Tersedia"
                    },
                    description: {
                        en: "A stable internet connection is available.",
                        ms: "Sambungan internet yang stabil tersedia."
                    }
                },

                {
                    value: "no",
                    label: {
                        en: "No Internet Available",
                        ms: "Tiada Internet"
                    },
                    description: {
                        en: "There is currently no internet connection at the installation location.",
                        ms: "Buat masa ini tiada sambungan internet di lokasi pemasangan."
                    }
                },

                {
                    value: "need_setup",
                    label: {
                        en: "Need Internet Setup",
                        ms: "Perlu Pemasangan Internet"
                    },
                    description: {
                        en: "Internet access needs to be arranged or installed.",
                        ms: "Akses internet perlu diatur atau dipasang."
                    }
                }
            ]
        },


        // ==================================================
        // 6. SOFTWARE / FEATURES
        // ==================================================

        {
            id: "software",
            type: "multi",

            title: {
                en: "What Features Do You Need?",
                ms: "Apakah Ciri Yang Anda Perlukan?"
            },

            description: {
                en: "Select the attendance management features required.",
                ms: "Pilih ciri pengurusan kehadiran yang diperlukan."
            },

            required: false,

            options: [
                {
                    value: "attendance_report",
                    label: {
                        en: "Attendance Reports",
                        ms: "Laporan Kehadiran"
                    },
                    description: {
                        en: "Generate and manage employee attendance reports.",
                        ms: "Jana dan urus laporan kehadiran pekerja."
                    }
                },

                {
                    value: "leave",
                    label: {
                        en: "Leave Management",
                        ms: "Pengurusan Cuti"
                    },
                    description: {
                        en: "Manage employee leave records.",
                        ms: "Urus rekod cuti pekerja."
                    }
                },

                {
                    value: "payroll",
                    label: {
                        en: "Payroll Integration",
                        ms: "Integrasi Payroll"
                    },
                    description: {
                        en: "Prepare attendance data for payroll processing.",
                        ms: "Sediakan data kehadiran untuk pemprosesan payroll."
                    }
                },

                {
                    value: "apps",
                    label: {
                        en: "Mobile App Access",
                        ms: "Akses Aplikasi Mudah Alih"
                    },
                    description: {
                        en: "Access and monitor attendance information using a mobile app.",
                        ms: "Akses dan pantau maklumat kehadiran menggunakan aplikasi mudah alih."
                    }
                }
            ]
        },


        // ==================================================
        // 7. SITE VISIT
        // ==================================================

        {
            id: "site_visit",
            type: "single",

            title: {
                en: "Site Visit",
                ms: "Lawatan Tapak"
            },

            description: {
                en: "Do you require a site visit before the final quotation?",
                ms: "Adakah anda memerlukan lawatan tapak sebelum sebut harga akhir?"
            },

            required: true,

            options: [
                {
                    value: "yes",
                    label: {
                        en: "Yes",
                        ms: "Ya"
                    },
                    description: {
                        en: "Our team will assess the site before preparing the final quotation.",
                        ms: "Pasukan kami akan menilai tapak sebelum menyediakan sebut harga akhir."
                    }
                },

                {
                    value: "no",
                    label: {
                        en: "No",
                        ms: "Tidak"
                    },
                    description: {
                        en: "Proceed based on the information provided.",
                        ms: "Teruskan berdasarkan maklumat yang diberikan."
                    }
                }
            ]
        }

    ]
},

 autogate: {
    id: "autogate",

    name: {
        en: "Autogate",
        ms: "Autogate"
    },

    questions: [

        /* =====================================================
           Q1 - DO YOU NEED A NEW GATE?
        ===================================================== */

        {
            id: "gate_status",
            type: "single",

            title: {
                en: "Do You Need a New Gate?",
                ms: "Adakah Anda Memerlukan Pagar Baharu?"
            },

            description: {
                en: "Let us know whether you need a new gate or already have an existing gate.",
                ms: "Maklumkan kepada kami sama ada anda memerlukan pagar baharu atau sudah mempunyai pagar sedia ada."
            },

            options: [

                [
                    "need_new_gate",
                    "Yes, I Need a New Gate",
                    "Ya, Saya Memerlukan Pagar Baharu",
                    "I need a new gate to be installed.",
                    "Saya memerlukan pagar baharu untuk dipasang."
                ],

                [
                    "already_have_gate",
                    "No, I Already Have a Gate",
                    "Tidak, Saya Sudah Mempunyai Pagar",
                    "I already have a gate and need an autogate solution.",
                    "Saya sudah mempunyai pagar dan memerlukan penyelesaian autogate."
                ]

            ]
        },


        /* =====================================================
           Q2 - GATE LENGTH
           ONLY FOR CUSTOMER WHO NEEDS A NEW GATE
        ===================================================== */

        {
            id: "length",
            type: "number",

            title: {
                en: "Gate Length",
                ms: "Panjang Pagar"
            },

            description: {
                en: "Enter the approximate overall length of the gate you need.",
                ms: "Masukkan anggaran panjang keseluruhan pagar yang anda perlukan."
            },

            placeholder: {
                en: "Enter length",
                ms: "Masukkan panjang"
            },

            unit: {
                en: "ft",
                ms: "kaki"
            },

            min_value: 1,
            max_value: 1000,
            step_value: 1,

            required: true,

            showIf: {
                question: "gate_status",
                equals: "need_new_gate"
            }
        },


        /* =====================================================
           Q3 - GATE MATERIAL
           ONLY FOR CUSTOMER WHO ALREADY HAS A GATE
        ===================================================== */

        {
            id: "material",
            type: "single",

            title: {
                en: "Gate Material",
                ms: "Material Pagar"
            },

            description: {
                en: "Choose the main material of your existing gate.",
                ms: "Pilih material utama pagar sedia ada anda."
            },

            required: true,

            showIf: {
                question: "gate_status",
                equals: "already_have_gate"
            },

            options: [

                [
                    "standard",
                    "Standard (Iron / Steel)",
                    "Biasa (Besi / Keluli)",
                    "A durable and value-focused standard option.",
                    "Pilihan biasa yang kukuh dan menjimatkan."
                ],

                [
                    "stainless_steel",
                    "Stainless Steel",
                    "Keluli Tahan Karat",
                    "Premium material with good corrosion resistance.",
                    "Material premium yang mempunyai ketahanan karat yang baik."
                ],

                [
                    "other",
                    "Other / Custom",
                    "Lain-lain / Custom",
                    "Specify your own gate material.",
                    "Nyatakan sendiri material pagar anda."
                ]

            ]
        },


        /* =====================================================
           Q4 - CUSTOM GATE MATERIAL
           ONLY SHOW IF OTHER / CUSTOM IS SELECTED
        ===================================================== */

        {
            id: "custom_material",
            type: "text",

            title: {
                en: "Specify Your Gate Material",
                ms: "Nyatakan Material Pagar Anda"
            },

            description: {
                en: "Please enter the material used for your existing gate.",
                ms: "Sila masukkan material yang digunakan untuk pagar sedia ada anda."
            },

            placeholder: {
                en: "Example: Aluminium, Wood, Glass, etc.",
                ms: "Contoh: Aluminium, Kayu, Kaca, dan sebagainya."
            },

            required: true,

            showIf: {
                question: "material",
                equals: "other"
            }
        },


        /* =====================================================
           Q5 - GATE TYPE
           ONLY FOR CUSTOMER WHO ALREADY HAS A GATE
        ===================================================== */

        {
            id: "gate_type",
            type: "single",

            title: {
                en: "Gate Type",
                ms: "Jenis Pagar"
            },

            description: {
                en: "Choose the design of your existing gate.",
                ms: "Pilih jenis pagar sedia ada anda."
            },

            required: true,

            showIf: {
                question: "gate_status",
                equals: "already_have_gate"
            },

            options: [

                [
                    "swing",
                    "Swing",
                    "Ayun",
                    "Gate opens inward or outward.",
                    "Pagar membuka ke dalam atau ke luar."
                ],

                [
                    "sliding",
                    "Sliding",
                    "Gelangsar",
                    "Gate moves along a track.",
                    "Pagar bergerak di sepanjang trek."
                ],

                [
                    "fold",
                    "Fold",
                    "Lipat",
                    "Folding gate suitable for limited space.",
                    "Pagar berlipat yang sesuai untuk ruang terhad."
                ]

            ]
        },


        /* =====================================================
           Q6 - POWER / WIRING
           EVERY CUSTOMER ANSWERS THIS
        ===================================================== */

        {
            id: "power",
            type: "single",

            title: {
                en: "Power Source / Wiring",
                ms: "Punca Kuasa / Pendawaian"
            },

            description: {
                en: "Choose the wiring status near the gate.",
                ms: "Pilih status pendawaian berhampiran pagar."
            },

            required: true,

            options: [

                [
                    "existing",
                    "Existing Wiring",
                    "Pendawaian Sedia Ada",
                    "Electricity is already available near the gate.",
                    "Bekalan elektrik sudah tersedia berhampiran pagar."
                ],

                [
                    "new",
                    "No Wiring Yet",
                    "Belum Ada Pendawaian",
                    "New wiring needs to be planned.",
                    "Pendawaian baharu perlu dirancang."
                ]

            ]
        },


        /* =====================================================
           Q7 - AUTOGATE CONTROL PACKAGE
           EVERY CUSTOMER ANSWERS THIS
        ===================================================== */

        {
            id: "control",
            type: "single",

            title: {
                en: "Autogate Control Package",
                ms: "Pakej Kawalan Autogate"
            },

            description: {
                en: "Choose the control package that suits your needs.",
                ms: "Pilih pakej kawalan yang sesuai dengan keperluan anda."
            },

            required: true,

            options: [

                [
                    "basic",
                    "Remote (Basic)",
                    "Remote (Asas)",
                    "Basic remote control for everyday gate operation.",
                    "Kawalan remote asas untuk kegunaan harian."
                ],

                [
                    "pro",
                    "Remote + Indoor Switch (Pro)",
                    "Remote + Suis Dalam Rumah (Pro)",
                    "Remote control with an indoor switch for convenient access.",
                    "Kawalan remote bersama suis dalam rumah untuk akses yang lebih mudah."
                ],

                [
                    "advanced",
                    "Remote + Indoor Switch + App (Advanced)",
                    "Remote + Suis Dalam Rumah + Aplikasi (Lanjutan)",
                    "Complete control using a remote, indoor switch and mobile app.",
                    "Kawalan lengkap menggunakan remote, suis dalam rumah dan aplikasi mudah alih."
                ]

            ]
        },


        /* =====================================================
           Q8 - SITE VISIT
           EVERY CUSTOMER ANSWERS THIS
        ===================================================== */

        {
            id: "site_visit",
            type: "single",

            title: {
                en: "Site Visit",
                ms: "Lawatan Tapak"
            },

            description: {
                en: "Do you require a site visit before the final quotation?",
                ms: "Adakah anda memerlukan lawatan tapak sebelum sebut harga akhir?"
            },

            required: true,

            options: [

                [
                    "yes",
                    "Yes",
                    "Ya",
                    "Our team will assess the site before preparing the final quotation.",
                    "Pasukan kami akan menilai tapak sebelum menyediakan sebut harga akhir."
                ],

                [
                    "no",
                    "No",
                    "Tidak",
                    "Proceed based on the information provided.",
                    "Teruskan berdasarkan maklumat yang diberikan."
                ]

            ]
        }

    ]
},

    barriergate: {
    id: "barriergate",

    name: {
        en: "Barrier Gate",
        ms: "Palang Automatik"
    },

    questions: [

        // ==================================================
        // 1. APPLICATION
        // ==================================================

        {
            id: "application",
            type: "single",

            title: {
                en: "Where will the barrier gate be used?",
                ms: "Di manakah palang automatik akan digunakan?"
            },

            description: {
                en: "Choose the main application.",
                ms: "Pilih kegunaan utama."
            },

            options: [
                {
                    value: "residential",
                    label: {
                        en: "Residential",
                        ms: "Kediaman"
                    },
                    description: {
                        en: "Housing areas, condominiums or private properties.",
                        ms: "Kawasan perumahan, kondominium atau hartanah persendirian."
                    }
                },

                {
                    value: "commercial",
                    label: {
                        en: "Commercial",
                        ms: "Komersial"
                    },
                    description: {
                        en: "Shop lots, offices or commercial buildings.",
                        ms: "Lot kedai, pejabat atau bangunan komersial."
                    }
                },

                {
                    value: "industrial",
                    label: {
                        en: "Industrial",
                        ms: "Industri"
                    },
                    description: {
                        en: "Factories, warehouses or industrial sites.",
                        ms: "Kilang, gudang atau kawasan industri."
                    }
                },

                {
                    value: "parking",
                    label: {
                        en: "Parking Area",
                        ms: "Kawasan Parkir"
                    },
                    description: {
                        en: "Parking entrances and controlled vehicle access.",
                        ms: "Pintu masuk parkir dan akses kenderaan terkawal."
                    }
                }
            ]
        },

        // ==================================================
        // 2. LANE
        // ==================================================

        {
            id: "lane",
            type: "single",

            title: {
                en: "How many lanes need a barrier?",
                ms: "Berapa lorong memerlukan palang?"
            },

            description: {
                en: "Select the number of vehicle lanes.",
                ms: "Pilih jumlah lorong kenderaan."
            },

            options: [
                {
                    value: "1",
                    label: {
                        en: "1 Lane",
                        ms: "1 Lorong"
                    },
                    description: {
                        en: "Single entry or exit lane.",
                        ms: "Satu lorong masuk atau keluar."
                    }
                },

                {
                    value: "2",
                    label: {
                        en: "2 Lanes",
                        ms: "2 Lorong"
                    },
                    description: {
                        en: "Separate entry and exit lanes.",
                        ms: "Lorong masuk dan keluar berasingan."
                    }
                },

                {
                    value: "3_plus",
                    label: {
                        en: "3+ Lanes",
                        ms: "3+ Lorong"
                    },
                    description: {
                        en: "Multiple vehicle access lanes.",
                        ms: "Pelbagai lorong akses kenderaan."
                    }
                }
            ]
        },

        // ==================================================
        // 3. ARM LENGTH
        // ==================================================

        {
            id: "arm_length",
            type: "number",

            title: {
                en: "Barrier Arm Length",
                ms: "Panjang Palang"
            },

            description: {
                en: "Enter the approximate barrier arm length.",
                ms: "Masukkan anggaran panjang palang."
            },

            placeholder: {
                en: "Enter length",
                ms: "Masukkan panjang"
            },

            unit: {
                en: "m",
                ms: "m"
            },

            min_value: 1,
            max_value: 20,
            step_value: 0.1,

            required: true
        },

        /* =====================================================
   Q4 - ACCESS METHOD
===================================================== */

{
    id: "access_method",
    type: "single",

    title: {
        en: "Access Method",
        ms: "Kaedah Akses"
    },

    description: {
        en: "Choose your preferred access method.",
        ms: "Pilih kaedah akses pilihan anda."
    },

    required: true,

    options: [

        [
            "card_tng_debit",
            "Access Card + Touch 'n Go + Debit Card",
            "Kad Akses + Touch 'n Go + Kad Debit",
            "Access using an access card, Touch 'n Go card or debit card.",
            "Akses menggunakan kad akses, kad Touch 'n Go atau kad debit."
        ],

        [
            "long_range_rfid",
            "Long Range + RFID",
            "Long Range + RFID",
            "Long-range access combined with RFID technology.",
            "Akses jarak jauh bersama teknologi RFID."
        ],

        [
            "npr",
            "NPR",
            "NPR",
            "Access using number plate recognition.",
            "Akses menggunakan pengecaman nombor plat."
        ]

    ]
},

        

        // ==================================================
        // 6. SITE VISIT
        // ==================================================

        {
            id: "site_visit",
            type: "single",

            title: {
                en: "Do you require a site visit?",
                ms: "Adakah anda memerlukan lawatan tapak?"
            },

            description: {
                en: "Our team can assess the lane layout and installation requirements.",
                ms: "Pasukan kami boleh menilai susun atur lorong dan keperluan pemasangan."
            },

            options: [
                {
                    value: "yes",
                    label: {
                        en: "Yes, Request Site Visit",
                        ms: "Ya, Perlukan Lawatan Tapak"
                    },
                    description: {
                        en: "Recommended for accurate installation planning.",
                        ms: "Disyorkan untuk perancangan pemasangan yang tepat."
                    }
                },

                {
                    value: "no",
                    label: {
                        en: "No, Direct Quotation",
                        ms: "Tidak, Sebut Harga Terus"
                    },
                    description: {
                        en: "Proceed using the information provided.",
                        ms: "Teruskan berdasarkan maklumat yang diberikan."
                    }
                }
            ]
        }
    ]
},

    pabx: {
    id: "pabx",

    name: {
        en: "PABX System",
        ms: "Sistem PABX"
    },

    questions: [

        // ==================================================
        // 1. SITE TYPE
        // ==================================================

        {
            id: "site",
            type: "single",

            title: {
                en: "Where will the PABX system be used?",
                ms: "Di manakah sistem PABX akan digunakan?"
            },

            description: {
                en: "Select the type of premises.",
                ms: "Pilih jenis premis."
            },

            options: [
                {
                    value: "office",
                    label: {
                        en: "Office",
                        ms: "Pejabat"
                    },
                    description: {
                        en: "Office or corporate workplace.",
                        ms: "Pejabat atau tempat kerja korporat."
                    }
                },
                {
                    value: "hotel",
                    label: {
                        en: "Hotel / Homestay",
                        ms: "Hotel / Homestay"
                    },
                    description: {
                        en: "Guest rooms and reception areas.",
                        ms: "Bilik tetamu dan kawasan kaunter penerimaan."
                    }
                },
                {
                    value: "shop",
                    label: {
                        en: "Shop / Retail",
                        ms: "Kedai / Runcit"
                    },
                    description: {
                        en: "Retail or commercial premises.",
                        ms: "Premis runcit atau komersial."
                    }
                },
                {
                    value: "factory",
                    label: {
                        en: "Factory / Warehouse",
                        ms: "Kilang / Gudang"
                    },
                    description: {
                        en: "Large operational premises.",
                        ms: "Premis operasi yang besar."
                    }
                }
            ]
        },

        // ==================================================
        // 2. EXTENSIONS
        // ==================================================

        {
            id: "extensions",
            type: "number",

            title: {
                en: "How many extensions are required?",
                ms: "Berapakah bilangan sambungan telefon yang diperlukan?"
            },

            description: {
                en: "Enter the estimated number of telephone extensions.",
                ms: "Masukkan anggaran bilangan sambungan telefon."
            },

            placeholder: {
                en: "e.g. 20",
                ms: "cth. 20"
            },

            unit: {
                en: "extensions",
                ms: "sambungan"
            },

            min_value: 1,
            max_value: 1000,
            step_value: 1,

            required: true
        },

        // ==================================================
        // 3. PHONE TYPE
        // ==================================================

        {
            id: "phone_type",
            type: "multi",

            title: {
                en: "What type of phones do you need?",
                ms: "Apakah jenis telefon yang anda perlukan?"
            },

            description: {
                en: "You can select multiple phone types.",
                ms: "Anda boleh memilih lebih daripada satu jenis telefon."
            },

            options: [
                {
                    value: "ip_phone",
                    label: {
                        en: "IP Phone",
                        ms: "Telefon IP"
                    },
                    description: {
                        en: "Network-based telephone.",
                        ms: "Telefon berasaskan rangkaian."
                    }
                },
                {
                    value: "analog",
                    label: {
                        en: "Analog Phone",
                        ms: "Telefon Analog"
                    },
                    description: {
                        en: "Standard analogue telephone.",
                        ms: "Telefon analog standard."
                    }
                },
                {
                    value: "cordless",
                    label: {
                        en: "Cordless Phone",
                        ms: "Telefon Tanpa Wayar"
                    },
                    description: {
                        en: "Wireless handset for flexible use.",
                        ms: "Telefon tanpa wayar untuk penggunaan fleksibel."
                    }
                },
                {
                    value: "softphone",
                    label: {
                        en: "Softphone / Mobile",
                        ms: "Softphone / Mudah Alih"
                    },
                    description: {
                        en: "Use a computer or mobile device as an extension.",
                        ms: "Gunakan komputer atau telefon mudah alih sebagai sambungan."
                    }
                }
            ]
        },

        // ==================================================
        // 4. MAIN FEATURES
        // ==================================================

        {
            id: "features",
            type: "multi",

            title: {
                en: "Which features do you need?",
                ms: "Apakah ciri yang anda perlukan?"
            },

            description: {
                en: "Select one or more PABX features.",
                ms: "Pilih satu atau lebih ciri PABX."
            },

            options: [
                {
                    value: "auto_attendant",
                    label: {
                        en: "Auto Attendant",
                        ms: "Auto Attendant"
                    },
                    description: {
                        en: "Automatically direct callers to the correct department.",
                        ms: "Arahkan pemanggil secara automatik ke jabatan yang betul."
                    }
                },
                {
                    value: "call_transfer",
                    label: {
                        en: "Call Transfer",
                        ms: "Pindahan Panggilan"
                    },
                    description: {
                        en: "Transfer calls between extensions.",
                        ms: "Pindahkan panggilan antara sambungan."
                    }
                },
                {
                    value: "call_recording",
                    label: {
                        en: "Call Recording",
                        ms: "Rakaman Panggilan"
                    },
                    description: {
                        en: "Record selected telephone conversations.",
                        ms: "Rakam perbualan telefon yang dipilih."
                    }
                },
                {
                    value: "conference",
                    label: {
                        en: "Conference Calling",
                        ms: "Panggilan Persidangan"
                    },
                    description: {
                        en: "Allow multiple users to join one call.",
                        ms: "Benarkan beberapa pengguna menyertai satu panggilan."
                    }
                },
                {
                    value: "mobile",
                    label: {
                        en: "Mobile / Remote Extension",
                        ms: "Sambungan Mudah Alih / Jarak Jauh"
                    },
                    description: {
                        en: "Connect remote users to the business phone system.",
                        ms: "Sambungkan pengguna jarak jauh kepada sistem telefon syarikat."
                    }
                }
            ]
        },

        // ==================================================
        // 5. EXISTING SYSTEM
        // ==================================================

        {
            id: "existing_system",
            type: "single",

            title: {
                en: "Do you already have a telephone system?",
                ms: "Adakah anda sudah mempunyai sistem telefon?"
            },

            description: {
                en: "Tell us whether this is a new installation or an upgrade.",
                ms: "Beritahu kami sama ada ini pemasangan baharu atau naik taraf."
            },

            options: [
                {
                    value: "new",
                    label: {
                        en: "New Installation",
                        ms: "Pemasangan Baharu"
                    },
                    description: {
                        en: "No existing PABX system.",
                        ms: "Tiada sistem PABX sedia ada."
                    }
                },
                {
                    value: "upgrade",
                    label: {
                        en: "Upgrade Existing System",
                        ms: "Naik Taraf Sistem Sedia Ada"
                    },
                    description: {
                        en: "Replace or expand an existing system.",
                        ms: "Gantikan atau tambah baik sistem sedia ada."
                    }
                }
            ]
        },

        // ==================================================
        // 6. SITE VISIT
        // ==================================================

        {
            id: "site_visit",
            type: "single",

            title: {
                en: "Do you require a site visit?",
                ms: "Adakah anda memerlukan lawatan tapak?"
            },

            description: {
                en: "Our team can inspect the existing telephone network and recommend a suitable solution.",
                ms: "Pasukan kami boleh memeriksa rangkaian telefon sedia ada dan mencadangkan penyelesaian yang sesuai."
            },

            options: [
                {
                    value: "yes",
                    label: {
                        en: "Yes, Request Site Visit",
                        ms: "Ya, Perlukan Lawatan Tapak"
                    },
                    description: {
                        en: "Recommended for larger or existing installations.",
                        ms: "Disyorkan untuk pemasangan besar atau sistem sedia ada."
                    }
                },
                {
                    value: "no",
                    label: {
                        en: "No, Direct Quotation",
                        ms: "Tidak, Sebut Harga Terus"
                    },
                    description: {
                        en: "Proceed using the information provided.",
                        ms: "Teruskan berdasarkan maklumat yang diberikan."
                    }
                }
            ]
        }
    ]
},

   solar_cctv: {
    id: "solar_cctv",

    name: {
        en: "Solar CCTV",
        ms: "Solar CCTV"
    },

    questions: [

        // ==================================================
        // 1. PROPERTY TYPE
        // ==================================================

        {
            id: "property",
            type: "single",

            title: {
                en: "Where will the Solar CCTV be used?",
                ms: "Di manakah Solar CCTV akan digunakan?"
            },

            description: {
                en: "Choose whether the system is for residential or commercial use.",
                ms: "Pilih sama ada sistem digunakan untuk kediaman atau kegunaan komersial."
            },

            options: [
                {
                    value: "home",

                    label: {
                        en: "Home",
                        ms: "Rumah"
                    },

                    description: {
                        en: "House, apartment or residential property.",
                        ms: "Rumah, apartmen atau hartanah kediaman."
                    }
                },

                {
                    value: "commercial",

                    label: {
                        en: "Commercial Use",
                        ms: "Kegunaan Komersial"
                    },

                    description: {
                        en: "Shop, office, warehouse, factory or commercial premises.",
                        ms: "Kedai, pejabat, gudang, kilang atau premis komersial."
                    }
                }
            ]
        },


        // ==================================================
        // 2. INTERNET ACCESS
        // ==================================================

        {
            id: "internet",
            type: "single",

            title: {
                en: "What internet access is available at the site?",
                ms: "Apakah sambungan internet yang tersedia di lokasi?"
            },

            description: {
                en: "Choose the available connection for remote CCTV viewing.",
                ms: "Pilih sambungan yang tersedia untuk pemantauan CCTV dari jauh."
            },

            options: [
                {
                    value: "wifi",

                    label: {
                        en: "Wi-Fi Available",
                        ms: "Wi-Fi Tersedia"
                    },

                    description: {
                        en: "The camera can connect to an existing Wi-Fi router.",
                        ms: "Kamera boleh disambungkan kepada router Wi-Fi sedia ada."
                    }
                },

                {
                    value: "4g",

                    label: {
                        en: "No Wi-Fi / 4G SIM",
                        ms: "Tiada Wi-Fi / SIM 4G"
                    },

                    description: {
                        en: "Suitable for locations without fixed internet access.",
                        ms: "Sesuai untuk lokasi tanpa sambungan internet tetap."
                    }
                },

                {
                    value: "unsure",

                    label: {
                        en: "Not Sure / Need Advice",
                        ms: "Tidak Pasti / Perlukan Nasihat"
                    },

                    description: {
                        en: "Our technical team can recommend a suitable connection.",
                        ms: "Pasukan teknikal kami boleh mencadangkan sambungan yang sesuai."
                    }
                }
            ]
        },


        // ==================================================
        // 3. CAMERA QUANTITY
        // ==================================================

        {
            id: "units",
            type: "counter",

            title: {
                en: "How many Solar CCTV cameras do you need?",
                ms: "Berapakah bilangan kamera Solar CCTV yang diperlukan?"
            },

            description: {
                en: "Use the + / − buttons to set the number of camera units.",
                ms: "Gunakan butang + / − untuk menetapkan jumlah unit kamera."
            },

            min_value: 1,
            max_value: 100,
            step_value: 1,

            required: true,

            counters: [
                {
                    id: "units",

                    label: {
                        en: "Solar CCTV Camera",
                        ms: "Kamera Solar CCTV"
                    },

                    description: {
                        en: "Solar-powered CCTV camera unit.",
                        ms: "Unit kamera CCTV yang menggunakan kuasa solar."
                    },

                    min_value: 1,
                    max_value: 100,
                    step_value: 1
                }
            ]
        },


        // ==================================================
        // 4. CAMERA TYPE
        // ==================================================

        {
            id: "camera_type",
            type: "single",

            title: {
                en: "Select your preferred camera type.",
                ms: "Pilih jenis kamera pilihan anda."
            },

            description: {
                en: "Choose the camera design that best suits your installation area.",
                ms: "Pilih reka bentuk kamera yang paling sesuai dengan kawasan pemasangan anda."
            },

            options: [
                {
                    value: "ptz",

                    label: {
                        en: "PTZ (Pan / Tilt / Zoom)",
                        ms: "PTZ (Pusing / Condong / Zum)"
                    },

                    description: {
                        en: "Can rotate, tilt and zoom for wider and flexible coverage.",
                        ms: "Boleh berpusing, condong dan zum untuk liputan yang lebih luas dan fleksibel."
                    }
                },

                {
                    value: "bullet",

                    label: {
                        en: "Bullet (Fixed)",
                        ms: "Bullet (Tetap)"
                    },

                    description: {
                        en: "Fixed viewing angle, suitable for outdoor and specific areas.",
                        ms: "Sudut pandangan tetap, sesuai untuk kawasan luar dan lokasi tertentu."
                    }
                }
            ]
        }

    ]
},

    solar_pump: {
    id: "solar_pump",

    name: {
        en: "Solar Water Pump",
        ms: "Pam Air Solar"
    },

    questions: [

        // ==================================================
        // 1. APPLICATION
        // ==================================================

        {
            id: "application",
            type: "single",

            title: {
                en: "What will the solar water pump be used for?",
                ms: "Untuk apakah pam air solar akan digunakan?"
            },

            description: {
                en: "Choose the main purpose of the water pump.",
                ms: "Pilih kegunaan utama pam air."
            },

            options: [
                {
                    value: "home",
                    label: {
                        en: "Home / Domestic",
                        ms: "Rumah / Domestik"
                    },
                    description: {
                        en: "Water supply for a home or residence.",
                        ms: "Bekalan air untuk rumah atau kediaman."
                    }
                },

                {
                    value: "farm",
                    label: {
                        en: "Farm / Agriculture",
                        ms: "Ladang / Pertanian"
                    },
                    description: {
                        en: "Watering crops, plants or agricultural areas.",
                        ms: "Menyiram tanaman atau kawasan pertanian."
                    }
                },

                {
                    value: "livestock",
                    label: {
                        en: "Livestock",
                        ms: "Ternakan"
                    },
                    description: {
                        en: "Water supply for livestock.",
                        ms: "Bekalan air untuk haiwan ternakan."
                    }
                },

                {
                    value: "commercial",
                    label: {
                        en: "Commercial",
                        ms: "Komersial"
                    },
                    description: {
                        en: "Water supply for commercial premises.",
                        ms: "Bekalan air untuk premis komersial."
                    }
                }
            ]
        },

        // ==================================================
        // 2. WATER SOURCE
        // ==================================================

        {
            id: "water_source",
            type: "single",

            title: {
                en: "What is your water source?",
                ms: "Apakah sumber air anda?"
            },

            description: {
                en: "Select where the pump will draw water from.",
                ms: "Pilih dari mana pam akan mengambil air."
            },

            options: [
                {
                    value: "well",
                    label: {
                        en: "Well / Borehole",
                        ms: "Telaga / Telaga Tiub"
                    },
                    description: {
                        en: "Groundwater source.",
                        ms: "Sumber air bawah tanah."
                    }
                },

                {
                    value: "river",
                    label: {
                        en: "River / Stream",
                        ms: "Sungai / Anak Sungai"
                    },
                    description: {
                        en: "Surface water source.",
                        ms: "Sumber air permukaan."
                    }
                },

                {
                    value: "tank",
                    label: {
                        en: "Water Tank",
                        ms: "Tangki Air"
                    },
                    description: {
                        en: "Pump transfers water from an existing tank.",
                        ms: "Pam memindahkan air dari tangki sedia ada."
                    }
                },

                {
                    value: "other",
                    label: {
                        en: "Other",
                        ms: "Lain-lain"
                    },
                    description: {
                        en: "Another water source.",
                        ms: "Sumber air lain."
                    }
                }
            ]
        },

        // ==================================================
        // 3. PUMPING DISTANCE / HEAD
        // ==================================================

        {
            id: "pump_height",
            type: "number",

            title: {
                en: "Approximate pumping height",
                ms: "Anggaran ketinggian pam"
            },

            description: {
                en: "Enter the approximate vertical height from the water source to the destination.",
                ms: "Masukkan anggaran ketinggian menegak dari sumber air ke lokasi tujuan."
            },

            placeholder: {
                en: "Enter height",
                ms: "Masukkan ketinggian"
            },

            unit: {
                en: "m",
                ms: "m"
            },

            min_value: 0,
            max_value: 500,
            step_value: 1,

            required: true
        },

        // ==================================================
        // 4. PIPE LENGTH
        // ==================================================

        {
            id: "pipe_length",
            type: "number",

            title: {
                en: "Approximate pipe length",
                ms: "Anggaran panjang paip"
            },

            description: {
                en: "Enter the approximate distance from the pump to the water destination.",
                ms: "Masukkan anggaran jarak dari pam ke lokasi air."
            },

            placeholder: {
                en: "Enter pipe length",
                ms: "Masukkan panjang paip"
            },

            unit: {
                en: "m",
                ms: "m"
            },

            min_value: 1,
            max_value: 5000,
            step_value: 1,

            required: true
        },

        // ==================================================
        // 5. WATER REQUIREMENT
        // ==================================================

        {
            id: "water_requirement",
            type: "single",

            title: {
                en: "How much water do you need?",
                ms: "Berapakah jumlah air yang diperlukan?"
            },

            description: {
                en: "Choose the approximate daily water requirement.",
                ms: "Pilih anggaran keperluan air harian."
            },

            options: [
                {
                    value: "low",
                    label: {
                        en: "Low",
                        ms: "Rendah"
                    },
                    description: {
                        en: "Small household or light usage.",
                        ms: "Kegunaan rumah kecil atau ringan."
                    }
                },

                {
                    value: "medium",
                    label: {
                        en: "Medium",
                        ms: "Sederhana"
                    },
                    description: {
                        en: "Regular household or moderate agricultural use.",
                        ms: "Kegunaan rumah biasa atau pertanian sederhana."
                    }
                },

                {
                    value: "high",
                    label: {
                        en: "High",
                        ms: "Tinggi"
                    },
                    description: {
                        en: "Large household, farm or commercial use.",
                        ms: "Kegunaan rumah besar, ladang atau komersial."
                    }
                },

                {
                    value: "unsure",
                    label: {
                        en: "Not Sure",
                        ms: "Tidak Pasti"
                    },
                    description: {
                        en: "Let our technical team recommend the pump size.",
                        ms: "Biarkan pasukan teknikal kami mencadangkan saiz pam."
                    }
                }
            ]
        },

        // ==================================================
        // 6. POWER / SITE CONDITION
        // ==================================================

        {
            id: "site_condition",
            type: "multi",

            title: {
                en: "What is available at the site?",
                ms: "Apakah yang tersedia di tapak?"
            },

            description: {
                en: "Select all conditions that apply.",
                ms: "Pilih semua keadaan yang berkaitan."
            },

            options: [
                {
                    value: "strong_sun",
                    label: {
                        en: "Good Sunlight",
                        ms: "Cahaya Matahari Baik"
                    },
                    description: {
                        en: "The site receives strong sunlight.",
                        ms: "Tapak menerima cahaya matahari yang baik."
                    }
                },

                {
                    value: "existing_tank",
                    label: {
                        en: "Existing Water Tank",
                        ms: "Tangki Air Sedia Ada"
                    },
                    description: {
                        en: "There is already a tank at the site.",
                        ms: "Terdapat tangki air sedia ada di tapak."
                    }
                },

                {
                    value: "existing_pipe",
                    label: {
                        en: "Existing Pipe",
                        ms: "Paip Sedia Ada"
                    },
                    description: {
                        en: "Existing water piping can potentially be reused.",
                        ms: "Paip air sedia ada mungkin boleh digunakan semula."
                    }
                },

                {
                    value: "remote_area",
                    label: {
                        en: "Remote Area",
                        ms: "Kawasan Terpencil"
                    },
                    description: {
                        en: "Limited access to grid electricity.",
                        ms: "Akses kepada bekalan elektrik grid adalah terhad."
                    }
                }
            ]
        }
    ]
},

    troubleshoot_repair: {
    id: "troubleshoot_repair",

    name: {
        en: "Troubleshoot & Repair",
        ms: "Penyelesaian Masalah & Pembaikan"
    },

    questions: [

        // ==================================================
        // 1. SYSTEM
        // ==================================================

        {
            id: "system",
            type: "single",

            title: {
                en: "Which system needs troubleshooting or repair?",
                ms: "Sistem manakah yang memerlukan pemeriksaan atau pembaikan?"
            },

            description: {
                en: "Select the system that is having a problem.",
                ms: "Pilih sistem yang mengalami masalah."
            },

            options: [

                {
                    value: "cctv",

                    label: {
                        en: "CCTV System",
                        ms: "Sistem CCTV"
                    },

                    description: {
                        en: "Camera, recorder, viewing or network problems.",
                        ms: "Masalah kamera, perakam, paparan atau rangkaian."
                    }
                },

                {
                    value: "alarm",

                    label: {
                        en: "Alarm System",
                        ms: "Sistem Penggera"
                    },

                    description: {
                        en: "Alarm, sensor, keypad or siren problems.",
                        ms: "Masalah penggera, sensor, keypad atau siren."
                    }
                },

                {
                    value: "access",

                    label: {
                        en: "Door Access",
                        ms: "Kawalan Akses Pintu"
                    },

                    description: {
                        en: "Card, fingerprint, face recognition or door lock problems.",
                        ms: "Masalah kad, cap jari, pengecaman muka atau kunci pintu."
                    }
                },

                {
                    value: "attendance",

                    label: {
                        en: "Time Attendance",
                        ms: "Sistem Kehadiran"
                    },

                    description: {
                        en: "Attendance terminal or software problems.",
                        ms: "Masalah terminal atau perisian kehadiran."
                    }
                },

                {
                    value: "autogate",

                    label: {
                        en: "Autogate",
                        ms: "Autogate"
                    },

                    description: {
                        en: "Gate motor, remote or control problems.",
                        ms: "Masalah motor pagar, alat kawalan atau sistem kawalan."
                    }
                },

                {
                    value: "barriergate",

                    label: {
                        en: "Barrier Gate",
                        ms: "Palang Automatik"
                    },

                    description: {
                        en: "Barrier arm, sensor or access control problems.",
                        ms: "Masalah palang, sensor atau kawalan akses."
                    }
                },

                {
                    value: "network",

                    label: {
                        en: "Network Solution",
                        ms: "Penyelesaian Rangkaian"
                    },

                    description: {
                        en: "Network, Wi-Fi, router, switch or connectivity problems.",
                        ms: "Masalah rangkaian, Wi-Fi, router, switch atau sambungan."
                    }
                },

                {
                    value: "smarthome",

                    label: {
                        en: "Smart Home",
                        ms: "Rumah Pintar"
                    },

                    description: {
                        en: "Smart devices, automation or home control problems.",
                        ms: "Masalah peranti pintar, automasi atau kawalan rumah."
                    }
                },

                {
                    value: "audio_visual",

                    label: {
                        en: "Audio Visual Solution",
                        ms: "Penyelesaian Audio Visual"
                    },

                    description: {
                        en: "Audio, speakers, displays, projectors or visual system problems.",
                        ms: "Masalah audio, pembesar suara, paparan, projektor atau sistem visual."
                    }
                },

                {
                    value: "pabx_intercom",

                    label: {
                        en: "PABX System / Intercom",
                        ms: "Sistem PABX / Interkom"
                    },

                    description: {
                        en: "Telephone, extension, PABX or intercom problems.",
                        ms: "Masalah telefon, sambungan, PABX atau interkom."
                    }
                },

                {
                    value: "solar_cctv",

                    label: {
                        en: "Solar CCTV",
                        ms: "Solar CCTV"
                    },

                    description: {
                        en: "Solar camera, battery, panel or connectivity problems.",
                        ms: "Masalah kamera solar, bateri, panel atau sambungan."
                    }
                },

                {
                    value: "solar_pump",

                    label: {
                        en: "Solar Water Pump",
                        ms: "Pam Air Solar"
                    },

                    description: {
                        en: "Pump, solar power, water flow or controller problems.",
                        ms: "Masalah pam, kuasa solar, aliran air atau pengawal."
                    }
                }

               

            ]
        }

    ]
},
};

module.exports = SERVICES;