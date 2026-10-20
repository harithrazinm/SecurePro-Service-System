-- SecurePro category workflow database migration
-- Adds Inspection and Maintenance & Service as first-class services and
-- registers the new category questions/options in the existing request-answer model.

INSERT INTO services (id, service_code, name_en, name_ms, description_en, description_ms, category, active, display_order) VALUES
('a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'inspection', 'Inspection', 'Pemeriksaan', 'Inspection and assessment of existing systems and sites.', 'Pemeriksaan dan penilaian sistem serta tapak sedia ada.', 'support', 1, 10),
('b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'maintenance_service', 'Maintenance & Service', 'Penyelenggaraan & Servis', 'Preventive maintenance, general service and system health checks.', 'Penyelenggaraan pencegahan, servis umum dan pemeriksaan kesihatan sistem.', 'support', 1, 11)
ON DUPLICATE KEY UPDATE name_en=VALUES(name_en), name_ms=VALUES(name_ms), description_en=VALUES(description_en), description_ms=VALUES(description_ms), category=VALUES(category), active=1, display_order=VALUES(display_order);

CREATE TABLE IF NOT EXISTS service_request_sequences (service_code varchar(50) NOT NULL, next_number int NOT NULL DEFAULT 1, PRIMARY KEY (service_code)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Update the existing Troubleshooting / Repair system question to the new category wording/options.
UPDATE service_questions SET title_en='Select System', title_ms='Pilih Sistem', description_en='Which system has an issue?', description_ms='Sistem manakah yang mengalami masalah?', required=1, display_order=0, active=1 WHERE id='5c083a8f-1225-4d27-9876-14b5360b1d9c' AND service_id='d1986b41-19ed-4a1b-9d8e-e3f595b15ac7';
DELETE FROM question_options WHERE question_id='5c083a8f-1225-4d27-9876-14b5360b1d9c';
INSERT INTO question_options (id, question_id, option_value, label_en, label_ms, description_en, description_ms, display_order, active) VALUES
('f7aced9c-717e-41cb-85bb-abd62f6185c1', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'cctv', 'CCTV', 'CCTV', NULL, NULL, 0, 1),
('7c73c99c-4437-4a57-8add-ae258ca6f966', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'alarm_system', 'Alarm System', 'Alarm System', NULL, NULL, 1, 1),
('73934fab-dd2a-44b6-b79f-73b1d2bf9d20', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'door_access', 'Door Access', 'Door Access', NULL, NULL, 2, 1),
('97b8659c-27c3-4ffb-82f4-be87e0e70a4e', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'barrier_gate_lpr', 'Barrier Gate / LPR', 'Barrier Gate / LPR', NULL, NULL, 3, 1),
('15499405-0fa0-4f74-9265-73337f9a5c2f', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'electrical', 'Electrical', 'Electrical', NULL, NULL, 4, 1),
('e9d5c735-e2c7-4d4e-a048-77e5c10ae54f', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'network_wifi', 'Network / WiFi', 'Network / WiFi', NULL, NULL, 5, 1),
('502d9e9d-3899-4346-9b15-06319f162282', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'intercom', 'Intercom', 'Intercom', NULL, NULL, 6, 1),
('03b8388c-98d6-4cc1-a6ef-c06b2d68698b', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'pa_audio_visual', 'PA / Audio Visual', 'PA / Audio Visual', NULL, NULL, 7, 1),
('38e3e717-6286-4b34-b6e8-84f0156e0b0d', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'attendance_system', 'Attendance System', 'Attendance System', NULL, NULL, 8, 1),
('6f1d9268-bc3d-4578-887c-61902e1fb6a5', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'smart_home', 'Smart Home', 'Smart Home', NULL, NULL, 9, 1),
('f6bf2fb3-be08-4e23-bbae-ff7d2ac260b8', '5c083a8f-1225-4d27-9876-14b5360b1d9c', 'other', 'Other', 'Other', NULL, NULL, 10, 1)
ON DUPLICATE KEY UPDATE label_en=VALUES(label_en), label_ms=VALUES(label_ms), active=1;

INSERT INTO service_questions (id, service_id, question_code, question_type, title_en, title_ms, description_en, description_ms, placeholder_en, placeholder_ms, unit, min_value, max_value, step_value, required, display_order, active) VALUES
('c976883a-f1f8-44d7-b466-cfbfafa54345', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'inspection_purpose', 'single', 'Inspection Purpose', 'Tujuan Pemeriksaan', 'What would you like us to inspect?', 'Apakah yang anda ingin kami periksa?', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 1),
('361887da-ae53-4d1e-ba0e-746402eae90a', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'inspection_systems', 'multi', 'System / Service', 'Sistem / Servis', 'Which system requires inspection? You may select more than one.', 'Sistem manakah yang memerlukan pemeriksaan? Boleh pilih lebih daripada satu.', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, 1),
('0ecac2ed-be33-4704-a213-16d547815871', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'current_condition', 'single', 'Current Condition', 'Keadaan Semasa', 'What is the current condition?', 'Apakah keadaan semasa?', NULL, NULL, NULL, NULL, NULL, NULL, 1, 2, 1),
('4f0c4b18-b1dd-41cc-b48f-f76146e57908', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'existing_details_brand', 'text', 'Brand', 'Jenama', 'These details are optional because many customers may not know the brand or model.', 'Butiran ini adalah pilihan kerana ramai pelanggan mungkin tidak mengetahui jenama atau model.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 3, 1),
('1db0c456-c76a-46e9-9361-d9f4c6fb419e', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'existing_details_model', 'text', 'Model', 'Model', 'These details are optional because many customers may not know the brand or model.', 'Butiran ini adalah pilihan kerana ramai pelanggan mungkin tidak mengetahui jenama atau model.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 4, 1),
('5800a9df-3f8d-4bab-b7a4-a0d52aa44f16', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'existing_details_quantity', 'text', 'Quantity / Points', 'Kuantiti / Point', 'These details are optional because many customers may not know the brand or model.', 'Butiran ini adalah pilihan kerana ramai pelanggan mungkin tidak mengetahui jenama atau model.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 5, 1),
('5a212686-861d-4e22-ac68-50ee3738dca2', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'existing_details_age', 'text', 'Approx. System Age', 'Anggaran Umur Sistem', 'These details are optional because many customers may not know the brand or model.', 'Butiran ini adalah pilihan kerana ramai pelanggan mungkin tidak mengetahui jenama atau model.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 6, 1),
('bb48e726-7093-48fe-9ac5-b83037e3dfce', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'existing_details_installed_by', 'single', 'Installed By', 'Dipasang Oleh', 'These details are optional because many customers may not know the brand or model.', 'Butiran ini adalah pilihan kerana ramai pelanggan mungkin tidak mengetahui jenama atau model.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 7, 1),
('9de78c9a-0d10-4b20-a708-997cbef606d0', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'existing_details_last_service_date', 'text', 'Last Service Date', 'Tarikh Servis Terakhir', 'These details are optional because many customers may not know the brand or model.', 'Butiran ini adalah pilihan kerana ramai pelanggan mungkin tidak mengetahui jenama atau model.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 8, 1),
('ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'inspection_targets', 'multi', 'What Needs to Be Inspected?', 'Apa Yang Perlu Diperiksa?', 'Use the checklist to quickly select the areas you want inspected.', 'Gunakan senarai semak untuk memilih bahagian yang ingin diperiksa.', NULL, NULL, NULL, NULL, NULL, NULL, 1, 9, 1),
('3fb22694-5be2-4737-a0c0-0f77e7d0ce4e', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'inspection_description_inspection_description', 'textarea', 'Description', 'Penerangan', NULL, NULL, 'Example: CCTV has been used for about 5 years. We want to know its current condition and whether an upgrade is needed.', 'Contoh: CCTV telah digunakan lebih kurang 5 tahun. Kami ingin tahu keadaan sistem sekarang dan sama ada perlu upgrade.', NULL, NULL, NULL, NULL, 0, 10, 1),
('ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'site_details_premise_type', 'single', 'Premise Type', 'Jenis Premis', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 11, 1),
('13bee04d-371f-444b-bf10-94b7e2df0e6a', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'site_details_site_address', 'textarea', 'Site Address', 'Alamat Tapak', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 12, 1),
('e3c061e9-4138-44bd-bc14-fa5114392e9c', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'site_details_contact_person', 'text', 'Contact Person', 'Pegawai Untuk Dihubungi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 13, 1),
('ab1be36b-9754-4d40-86ad-7c03649ad4cc', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'site_details_contact_number', 'text', 'Contact Number', 'Nombor Telefon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 14, 1),
('8940d31c-88bc-4d26-a62b-9540ae1d9d43', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'site_details_site_access_notes', 'textarea', 'Site Access Notes', 'Nota Akses Tapak', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 15, 1),
('12f51c95-919d-4744-8eb3-c71c847dd472', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'appointment_preferred_date', 'text', 'Preferred Date', 'Tarikh Pilihan', 'Preferred inspection schedule.', 'Jadual pemeriksaan pilihan.', NULL, NULL, NULL, NULL, NULL, NULL, 1, 16, 1),
('f1868876-53e9-4a17-8c70-ab32d823febc', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'appointment_preferred_time', 'text', 'Preferred Time', 'Masa Pilihan', 'Preferred inspection schedule.', 'Jadual pemeriksaan pilihan.', NULL, NULL, NULL, NULL, NULL, NULL, 1, 17, 1),
('8730c013-b653-4cc7-bd76-8dd7fbb8284f', 'a8d8f0b7-1d72-4b44-9c8d-6d0d8d2c1101', 'appointment_alternative_date', 'text', 'Alternative Date', 'Tarikh Alternatif', 'Preferred inspection schedule.', 'Jadual pemeriksaan pilihan.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 18, 1),
('3de31698-8062-4a84-82da-3f578ac689aa', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'service_type', 'single', 'Select Service Type', 'Pilih Jenis Servis', 'Choose the purpose of your maintenance request.', 'Pilih tujuan permintaan penyelenggaraan anda.', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 1),
('c2b9aa99-19a1-4c71-95de-afb6912cddde', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'systems', 'multi', 'Select System', 'Pilih Sistem', 'Select one or more systems.', 'Pilih satu atau lebih sistem.', NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, 1),
('a67c7617-486d-4012-be8e-ff3d5cb4a727', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'system_information_installed_by', 'single', 'System Installed By', 'Sistem Dipasang Oleh', 'Provide what you know about the existing system. Optional information can be left blank.', 'Masukkan maklumat yang anda tahu tentang sistem sedia ada. Maklumat pilihan boleh dibiarkan kosong.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 2, 1),
('d5cb3d2e-8f92-4e73-8711-bbef75fdfcd7', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'system_information_system_age', 'text', 'Approximate System Age', 'Anggaran Umur Sistem', 'Provide what you know about the existing system. Optional information can be left blank.', 'Masukkan maklumat yang anda tahu tentang sistem sedia ada. Maklumat pilihan boleh dibiarkan kosong.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 3, 1),
('84d88929-f61a-47e3-a18a-06791ced73ff', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'system_information_quantity', 'number', 'Quantity / Number of Devices', 'Kuantiti / Bilangan Peranti', 'Provide what you know about the existing system. Optional information can be left blank.', 'Masukkan maklumat yang anda tahu tentang sistem sedia ada. Maklumat pilihan boleh dibiarkan kosong.', NULL, NULL, NULL, '0', NULL, NULL, 0, 4, 1),
('28e82dc0-414c-4db2-91ca-67f504923867', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'system_information_last_service_date', 'text', 'Last Service Date', 'Tarikh Servis Terakhir', 'Provide what you know about the existing system. Optional information can be left blank.', 'Masukkan maklumat yang anda tahu tentang sistem sedia ada. Maklumat pilihan boleh dibiarkan kosong.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 5, 1),
('d1e43aad-2886-4b0c-a9f4-eeaae6cf263b', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'system_information_system_status', 'single', 'Is the system currently working?', 'Adakah sistem sedang berfungsi?', 'Provide what you know about the existing system. Optional information can be left blank.', 'Masukkan maklumat yang anda tahu tentang sistem sedia ada. Maklumat pilihan boleh dibiarkan kosong.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 6, 1),
('80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'site_appointment_premise_type', 'single', 'Premise Type', 'Jenis Premis', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 7, 1),
('a8f8203b-fe30-4260-9dca-ba416943befb', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'site_appointment_site_address', 'textarea', 'Address', 'Alamat', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 8, 1),
('4c48b70e-aeda-4fb2-a18d-8b0c64df9873', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'site_appointment_contact_person', 'text', 'Contact Person', 'Pegawai Untuk Dihubungi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 9, 1),
('e353c87f-9759-49f2-8e08-57e3ca50923d', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'site_appointment_contact_number', 'text', 'Contact Number', 'Nombor Telefon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 10, 1),
('75b83fec-4948-4070-87d9-fba7120e64c3', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'site_appointment_preferred_date', 'text', 'Preferred Date', 'Tarikh Pilihan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 11, 1),
('668553b0-6e62-490a-918c-590bcc7ab9c2', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'site_appointment_preferred_time', 'text', 'Preferred Time', 'Masa Pilihan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 12, 1),
('a9d4dcf7-478d-4158-b396-a99e4a06e6bc', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'site_appointment_access_instructions', 'textarea', 'Access Instructions', 'Arahan Akses', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 13, 1),
('fc6b1e75-862c-479f-a6ee-46a022453ba2', 'b7e9a3d4-2c61-4d8a-a5f7-1e8c9b3d2202', 'maintenance_notes_additional_notes', 'textarea', 'Anything else we should know?', 'Ada apa-apa maklumat lain yang perlu kami tahu?', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 14, 1),
('e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'issue_type', 'single', 'Issue Details', 'Butiran Masalah', 'What problem are you experiencing?', 'Apakah masalah yang anda alami?', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0, 1),
('4d3b79ea-be4b-4ca7-87c1-3194851d70b2', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'problem_problem_description', 'textarea', 'Problem Description', 'Penerangan Masalah', NULL, NULL, 'Example: 4 of 8 CCTV cameras have no display since yesterday.', 'Contoh: 4 daripada 8 CCTV tiada display sejak semalam.', NULL, NULL, NULL, NULL, 1, 1, 1),
('b49ba95e-aa70-4f99-9cf2-ac51d5ac93a2', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'system_information_installed_by', 'single', 'Installed By', 'Dipasang Oleh', 'Tell us about the existing system.', 'Beritahu kami tentang sistem sedia ada.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 2, 1),
('c41cb9a4-f256-46b2-a292-def901667a42', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'system_information_brand', 'text', 'Brand', 'Jenama', 'Tell us about the existing system.', 'Beritahu kami tentang sistem sedia ada.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 3, 1),
('caa05392-5bed-48a0-a144-8ad630dde87a', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'system_information_model', 'text', 'Model', 'Model', 'Tell us about the existing system.', 'Beritahu kami tentang sistem sedia ada.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 4, 1),
('1cb473a7-d931-41b0-89cb-2812fcf8dcf7', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'system_information_quantity', 'number', 'Quantity / Points', 'Kuantiti / Point', 'Tell us about the existing system.', 'Beritahu kami tentang sistem sedia ada.', NULL, NULL, NULL, '0', NULL, NULL, 0, 5, 1),
('123e1045-5d5e-47ae-8c61-fba2cdd5d321', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'system_information_system_age', 'text', 'Approx. System Age', 'Anggaran Umur Sistem', 'Tell us about the existing system.', 'Beritahu kami tentang sistem sedia ada.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 6, 1),
('29b45bbd-1ca5-43f0-a276-83e3979c3f45', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'system_information_problem_started', 'single', 'Problem Started', 'Masalah Bermula', 'Tell us about the existing system.', 'Beritahu kami tentang sistem sedia ada.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 7, 1),
('1f72205e-af95-401a-b8b3-7effbded0274', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'support_diagnostic_notes', 'textarea', 'Additional Diagnostic Notes', 'Nota Diagnosis Tambahan', 'Upload support can remain optional. Add diagnostic information here for now.', 'Muat naik sokongan boleh kekal pilihan. Masukkan maklumat diagnosis di sini buat masa ini.', 'Error message, warning, symptoms, affected devices, etc.', 'Mesej error, warning, simptom, peranti terjejas, dan sebagainya.', NULL, NULL, NULL, NULL, 0, 8, 1),
('05ecd4f6-83a5-4203-88f9-a8ea4d47390c', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'support_priority', 'single', 'Priority', 'Keutamaan', 'Upload support can remain optional. Add diagnostic information here for now.', 'Muat naik sokongan boleh kekal pilihan. Masukkan maklumat diagnosis di sini buat masa ini.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 9, 1),
('e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'site_contact_premise_type', 'single', 'Premise Type', 'Jenis Premis', 'Provide these details if a site visit may be required.', 'Berikan butiran ini jika lawatan tapak mungkin diperlukan.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 10, 1),
('8ac60cd1-fbc3-4c52-9f2f-bb9a6de152b8', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'site_contact_site_address', 'textarea', 'Site Address', 'Alamat Tapak', 'Provide these details if a site visit may be required.', 'Berikan butiran ini jika lawatan tapak mungkin diperlukan.', NULL, NULL, NULL, NULL, NULL, NULL, 1, 11, 1),
('07c56573-3644-4dea-8a08-462c92c451e6', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'site_contact_contact_person', 'text', 'Contact Person', 'Pegawai Untuk Dihubungi', 'Provide these details if a site visit may be required.', 'Berikan butiran ini jika lawatan tapak mungkin diperlukan.', NULL, NULL, NULL, NULL, NULL, NULL, 1, 12, 1),
('a422dfb9-ddd6-4ad6-9d12-cba225dbcd6d', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'site_contact_contact_number', 'text', 'Contact Number', 'Nombor Telefon', 'Provide these details if a site visit may be required.', 'Berikan butiran ini jika lawatan tapak mungkin diperlukan.', NULL, NULL, NULL, NULL, NULL, NULL, 1, 13, 1),
('d8acddf5-cfee-40c8-9266-70dcda8f6990', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'site_contact_preferred_date', 'text', 'Preferred Date', 'Tarikh Pilihan', 'Provide these details if a site visit may be required.', 'Berikan butiran ini jika lawatan tapak mungkin diperlukan.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 14, 1),
('df7e1bcd-3277-42b5-9d00-ebeece09bfd3', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'site_contact_preferred_time', 'text', 'Preferred Time', 'Masa Pilihan', 'Provide these details if a site visit may be required.', 'Berikan butiran ini jika lawatan tapak mungkin diperlukan.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 15, 1),
('9455dea8-7e16-41c1-b526-69ef6c9329b4', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'site_contact_site_access_notes', 'textarea', 'Site Access Notes', 'Nota Akses Tapak', 'Provide these details if a site visit may be required.', 'Berikan butiran ini jika lawatan tapak mungkin diperlukan.', NULL, NULL, NULL, NULL, NULL, NULL, 0, 16, 1),
('15f807ea-666c-4c6c-9fa3-5ae29f541ed6', 'd1986b41-19ed-4a1b-9d8e-e3f595b15ac7', 'additional_additional_notes', 'textarea', 'Anything else our technician should know?', 'Apa-apa maklumat lain yang perlu diketahui oleh juruteknik?', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 17, 1)
ON DUPLICATE KEY UPDATE question_type=VALUES(question_type), title_en=VALUES(title_en), title_ms=VALUES(title_ms), description_en=VALUES(description_en), description_ms=VALUES(description_ms), placeholder_en=VALUES(placeholder_en), placeholder_ms=VALUES(placeholder_ms), min_value=VALUES(min_value), required=VALUES(required), display_order=VALUES(display_order), active=1;

DELETE FROM question_options WHERE question_id='c976883a-f1f8-44d7-b466-cfbfafa54345';
DELETE FROM question_options WHERE question_id='361887da-ae53-4d1e-ba0e-746402eae90a';
DELETE FROM question_options WHERE question_id='0ecac2ed-be33-4704-a213-16d547815871';
DELETE FROM question_options WHERE question_id='4f0c4b18-b1dd-41cc-b48f-f76146e57908';
DELETE FROM question_options WHERE question_id='1db0c456-c76a-46e9-9361-d9f4c6fb419e';
DELETE FROM question_options WHERE question_id='5800a9df-3f8d-4bab-b7a4-a0d52aa44f16';
DELETE FROM question_options WHERE question_id='5a212686-861d-4e22-ac68-50ee3738dca2';
DELETE FROM question_options WHERE question_id='bb48e726-7093-48fe-9ac5-b83037e3dfce';
DELETE FROM question_options WHERE question_id='9de78c9a-0d10-4b20-a708-997cbef606d0';
DELETE FROM question_options WHERE question_id='ba5b8f98-19f8-4d7b-922a-e3f2e4362590';
DELETE FROM question_options WHERE question_id='3fb22694-5be2-4737-a0c0-0f77e7d0ce4e';
DELETE FROM question_options WHERE question_id='ca91b8a6-cad6-4efa-bd80-3ad311cfabf3';
DELETE FROM question_options WHERE question_id='13bee04d-371f-444b-bf10-94b7e2df0e6a';
DELETE FROM question_options WHERE question_id='e3c061e9-4138-44bd-bc14-fa5114392e9c';
DELETE FROM question_options WHERE question_id='ab1be36b-9754-4d40-86ad-7c03649ad4cc';
DELETE FROM question_options WHERE question_id='8940d31c-88bc-4d26-a62b-9540ae1d9d43';
DELETE FROM question_options WHERE question_id='12f51c95-919d-4744-8eb3-c71c847dd472';
DELETE FROM question_options WHERE question_id='f1868876-53e9-4a17-8c70-ab32d823febc';
DELETE FROM question_options WHERE question_id='8730c013-b653-4cc7-bd76-8dd7fbb8284f';
DELETE FROM question_options WHERE question_id='3de31698-8062-4a84-82da-3f578ac689aa';
DELETE FROM question_options WHERE question_id='c2b9aa99-19a1-4c71-95de-afb6912cddde';
DELETE FROM question_options WHERE question_id='a67c7617-486d-4012-be8e-ff3d5cb4a727';
DELETE FROM question_options WHERE question_id='d5cb3d2e-8f92-4e73-8711-bbef75fdfcd7';
DELETE FROM question_options WHERE question_id='84d88929-f61a-47e3-a18a-06791ced73ff';
DELETE FROM question_options WHERE question_id='28e82dc0-414c-4db2-91ca-67f504923867';
DELETE FROM question_options WHERE question_id='d1e43aad-2886-4b0c-a9f4-eeaae6cf263b';
DELETE FROM question_options WHERE question_id='80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef';
DELETE FROM question_options WHERE question_id='a8f8203b-fe30-4260-9dca-ba416943befb';
DELETE FROM question_options WHERE question_id='4c48b70e-aeda-4fb2-a18d-8b0c64df9873';
DELETE FROM question_options WHERE question_id='e353c87f-9759-49f2-8e08-57e3ca50923d';
DELETE FROM question_options WHERE question_id='75b83fec-4948-4070-87d9-fba7120e64c3';
DELETE FROM question_options WHERE question_id='668553b0-6e62-490a-918c-590bcc7ab9c2';
DELETE FROM question_options WHERE question_id='a9d4dcf7-478d-4158-b396-a99e4a06e6bc';
DELETE FROM question_options WHERE question_id='fc6b1e75-862c-479f-a6ee-46a022453ba2';
DELETE FROM question_options WHERE question_id='e5c39918-a7c7-4d63-91e6-13a5ee1aba5a';
DELETE FROM question_options WHERE question_id='4d3b79ea-be4b-4ca7-87c1-3194851d70b2';
DELETE FROM question_options WHERE question_id='b49ba95e-aa70-4f99-9cf2-ac51d5ac93a2';
DELETE FROM question_options WHERE question_id='c41cb9a4-f256-46b2-a292-def901667a42';
DELETE FROM question_options WHERE question_id='caa05392-5bed-48a0-a144-8ad630dde87a';
DELETE FROM question_options WHERE question_id='1cb473a7-d931-41b0-89cb-2812fcf8dcf7';
DELETE FROM question_options WHERE question_id='123e1045-5d5e-47ae-8c61-fba2cdd5d321';
DELETE FROM question_options WHERE question_id='29b45bbd-1ca5-43f0-a276-83e3979c3f45';
DELETE FROM question_options WHERE question_id='1f72205e-af95-401a-b8b3-7effbded0274';
DELETE FROM question_options WHERE question_id='05ecd4f6-83a5-4203-88f9-a8ea4d47390c';
DELETE FROM question_options WHERE question_id='e38ea87c-f034-4e44-be5b-ad4ac3c4372d';
DELETE FROM question_options WHERE question_id='8ac60cd1-fbc3-4c52-9f2f-bb9a6de152b8';
DELETE FROM question_options WHERE question_id='07c56573-3644-4dea-8a08-462c92c451e6';
DELETE FROM question_options WHERE question_id='a422dfb9-ddd6-4ad6-9d12-cba225dbcd6d';
DELETE FROM question_options WHERE question_id='d8acddf5-cfee-40c8-9266-70dcda8f6990';
DELETE FROM question_options WHERE question_id='df7e1bcd-3277-42b5-9d00-ebeece09bfd3';
DELETE FROM question_options WHERE question_id='9455dea8-7e16-41c1-b526-69ef6c9329b4';
DELETE FROM question_options WHERE question_id='15f807ea-666c-4c6c-9fa3-5ae29f541ed6';
DELETE FROM question_options WHERE question_id='5c083a8f-1225-4d27-9876-14b5360b1d9c';

INSERT INTO question_options (id, question_id, option_value, label_en, label_ms, description_en, description_ms, display_order, active) VALUES
('87659910-e145-408f-a641-28a3019797e0', 'c976883a-f1f8-44d7-b466-cfbfafa54345', 'existing', 'Existing System Assessment', 'Semak keadaan sistem sedia ada', NULL, NULL, 0, 1),
('67c048be-10f8-4069-bd53-58850fc03f43', 'c976883a-f1f8-44d7-b466-cfbfafa54345', 'site', 'Site / Technical Assessment', 'Pemeriksaan keadaan tapak', NULL, NULL, 1, 1),
('4444f290-fa3a-477e-af2d-8f023d2d6e6c', 'c976883a-f1f8-44d7-b466-cfbfafa54345', 'upgrade', 'Upgrade Assessment', 'Semak kesesuaian untuk upgrade', NULL, NULL, 2, 1),
('30c3cc56-34a8-47a2-8a9e-2c38a9faaf2c', 'c976883a-f1f8-44d7-b466-cfbfafa54345', 'expansion', 'Expansion Assessment', 'Tambah device / point pada sistem sedia ada', NULL, NULL, 3, 1),
('099bd617-8270-4a98-972c-1ce392b0c73c', 'c976883a-f1f8-44d7-b466-cfbfafa54345', 'safety', 'Safety / Condition Assessment', 'Semak keadaan dan keselamatan pemasangan', NULL, NULL, 4, 1),
('90637c23-d50f-46cd-bb2d-44be5d76cf17', 'c976883a-f1f8-44d7-b466-cfbfafa54345', 'consultation', 'Second Opinion / Consultation', 'Dapatkan pandangan teknikal Sonic', NULL, NULL, 5, 1),
('0d81b60f-e237-4493-9589-0d3174a60d9e', 'c976883a-f1f8-44d7-b466-cfbfafa54345', 'other', 'Others', 'Lain-lain', NULL, NULL, 6, 1),
('c70c1c22-d71b-4adc-bc6c-503094a6d148', '361887da-ae53-4d1e-ba0e-746402eae90a', 'cctv', 'CCTV', 'CCTV', NULL, NULL, 0, 1),
('5129dd69-68aa-4450-a716-9eab4ee0a8e4', '361887da-ae53-4d1e-ba0e-746402eae90a', 'alarm', 'Alarm', 'Alarm', NULL, NULL, 1, 1),
('c0451bc8-5294-4b5e-9cad-184e6616914c', '361887da-ae53-4d1e-ba0e-746402eae90a', 'access', 'Door Access', 'Door Access', NULL, NULL, 2, 1),
('24c38a34-d72a-436d-9622-c52953308195', '361887da-ae53-4d1e-ba0e-746402eae90a', 'barrier', 'Barrier Gate / LPR', 'Barrier Gate / LPR', NULL, NULL, 3, 1),
('23ec5f8f-3522-4b57-ab55-191d2c0aa8ea', '361887da-ae53-4d1e-ba0e-746402eae90a', 'electrical', 'Electrical', 'Electrical', NULL, NULL, 4, 1),
('739e2f36-31d5-4e34-8003-04483186a972', '361887da-ae53-4d1e-ba0e-746402eae90a', 'network', 'Network / WiFi', 'Network / WiFi', NULL, NULL, 5, 1),
('a477f931-35d6-44f8-ad14-1e12d159c991', '361887da-ae53-4d1e-ba0e-746402eae90a', 'intercom', 'Intercom', 'Intercom', NULL, NULL, 6, 1),
('8b418748-4b8c-4978-8b59-4c94c442220f', '361887da-ae53-4d1e-ba0e-746402eae90a', 'pa', 'PA / Audio Visual', 'PA / Audio Visual', NULL, NULL, 7, 1),
('52c47efb-ce7d-4230-bfdd-4144db305662', '361887da-ae53-4d1e-ba0e-746402eae90a', 'attendance', 'Attendance', 'Attendance', NULL, NULL, 8, 1),
('9241db9d-7b77-414f-973e-71d9df742704', '361887da-ae53-4d1e-ba0e-746402eae90a', 'smart_home', 'Smart Home', 'Smart Home', NULL, NULL, 9, 1),
('ff31127a-78e0-4cb9-8c1f-87ec364a4923', '361887da-ae53-4d1e-ba0e-746402eae90a', 'other', 'Other', 'Other', NULL, NULL, 10, 1),
('dc21ff87-dcad-48b4-88be-e3fbf33d719e', '0ecac2ed-be33-4704-a213-16d547815871', 'working', 'Working Normally', 'Berfungsi seperti biasa', NULL, NULL, 0, 1),
('388b6797-514c-4ee1-8b55-7bb07a9d3f91', '0ecac2ed-be33-4704-a213-16d547815871', 'assessment', 'Working, but needs assessment', 'Berfungsi tetapi perlu penilaian', NULL, NULL, 1, 1),
('83713732-02bb-4c9e-9c50-e4c8c8a9b216', '0ecac2ed-be33-4704-a213-16d547815871', 'partial', 'Partially Working', 'Berfungsi sebahagian', NULL, NULL, 2, 1),
('bb1f0c41-9758-4d05-bc46-0c041a830137', '0ecac2ed-be33-4704-a213-16d547815871', 'old', 'Old / Outdated System', 'Sistem lama / ketinggalan', NULL, NULL, 3, 1),
('8aaebc65-1a93-4df5-aba3-b74585725225', '0ecac2ed-be33-4704-a213-16d547815871', 'unsure', 'Not Sure', 'Tidak pasti', NULL, NULL, 4, 1),
('89133320-8354-4f73-8f2b-c02879b62a98', 'bb48e726-7093-48fe-9ac5-b83037e3dfce', 'sonic', 'Sonic', 'Sonic', NULL, NULL, 0, 1),
('a23040bd-8901-40f8-8b70-37bbea31a238', 'bb48e726-7093-48fe-9ac5-b83037e3dfce', 'other', 'Other Contractor', 'Kontraktor Lain', NULL, NULL, 1, 1),
('52929af5-e3e8-454a-baee-556d1757bbea', 'bb48e726-7093-48fe-9ac5-b83037e3dfce', 'unknown', 'Unknown', 'Tidak Pasti', NULL, NULL, 2, 1),
('89b8add2-71dc-494c-9780-0652dbd3c2cc', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'overall_system_condition', 'Overall System Condition', 'Overall System Condition', NULL, NULL, 0, 1),
('3a9521e0-bd17-4f77-8e54-1c67afb7f881', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'equipment_devices', 'Equipment / Devices', 'Equipment / Devices', NULL, NULL, 1, 1),
('c5776896-7595-4dab-aa46-3948126648a4', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'cabling_connection', 'Cabling & Connection', 'Cabling & Connection', NULL, NULL, 2, 1),
('2a9fbfb9-0414-4dc8-a24f-967127348545', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'power_supply', 'Power Supply', 'Power Supply', NULL, NULL, 3, 1),
('62d443bd-213c-42f3-ac29-2efc9c94145f', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'network_connectivity', 'Network / Connectivity', 'Network / Connectivity', NULL, NULL, 4, 1),
('f2b3d6d1-8497-437a-864d-6bd5f973c7bd', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'configuration_settings', 'Configuration / Settings', 'Configuration / Settings', NULL, NULL, 5, 1),
('683ec485-2f5f-49ab-83db-2e1e95d20b07', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'installation_condition', 'Installation Condition', 'Installation Condition', NULL, NULL, 6, 1),
('caf3e091-813e-42ae-a977-032a79278ef8', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'coverage_performance', 'Coverage / Performance', 'Coverage / Performance', NULL, NULL, 7, 1),
('c797566c-8ac4-430b-af27-afa5f724ecb0', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'upgrade_possibility', 'Upgrade Possibility', 'Upgrade Possibility', NULL, NULL, 8, 1),
('044aee32-b946-4f56-a37d-9f203b38720a', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'expansion_possibility', 'Expansion Possibility', 'Expansion Possibility', NULL, NULL, 9, 1),
('7203f0a2-6d26-45ea-a91e-ad1519ef429b', 'ba5b8f98-19f8-4d7b-922a-e3f2e4362590', 'other', 'Other', 'Other', NULL, NULL, 10, 1),
('f64d20d4-ebb4-40f2-94bd-6d1ed38e5406', 'ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'residential', 'Residential', 'Residential', NULL, NULL, 0, 1),
('adf17a33-c4f0-464e-9793-fdf51e6a94f2', 'ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'shop', 'Shop', 'Shop', NULL, NULL, 1, 1),
('a4d2d410-3b37-4698-a873-ea6750a3724a', 'ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'office', 'Office', 'Office', NULL, NULL, 2, 1),
('b29987d3-8944-407a-972e-c8f8fdb125d1', 'ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'factory', 'Factory', 'Factory', NULL, NULL, 3, 1),
('98d676f5-8b40-4b7f-a2be-4ffb20cf74f1', 'ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'warehouse', 'Warehouse', 'Warehouse', NULL, NULL, 4, 1),
('5c2665fc-28ad-40a5-85ae-b0629dd1dd57', 'ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'school', 'School', 'School', NULL, NULL, 5, 1),
('9aecc8af-89a3-4f7b-9cff-995b97b1b84c', 'ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'mosque', 'Mosque', 'Mosque', NULL, NULL, 6, 1),
('fb6a8008-6262-401e-af8d-e38b8fac75f1', 'ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'government', 'Government', 'Government', NULL, NULL, 7, 1),
('3e997654-adc6-4c62-8a0a-78384bd964e0', 'ca91b8a6-cad6-4efa-bd80-3ad311cfabf3', 'other', 'Other', 'Other', NULL, NULL, 8, 1),
('c999b39b-de9e-4c88-b734-564f36fb8876', '3de31698-8062-4a84-82da-3f578ac689aa', 'preventive', 'Preventive Maintenance', 'Servis berkala untuk elakkan kerosakan', NULL, NULL, 0, 1),
('8dbd0bc4-7414-473e-87e0-5e4005906973', '3de31698-8062-4a84-82da-3f578ac689aa', 'general', 'General Service', 'Cleaning, checking, adjustment & testing', NULL, NULL, 1, 1),
('973942d3-e943-4995-8823-61f51973437e', '3de31698-8062-4a84-82da-3f578ac689aa', 'health_check', 'System Health Check', 'Semak keseluruhan keadaan sistem', NULL, NULL, 2, 1),
('6c808b59-a412-4696-bfaf-a9cb22def31b', '3de31698-8062-4a84-82da-3f578ac689aa', 'scheduled', 'Scheduled Maintenance', 'Maintenance mengikut kontrak / jadual', NULL, NULL, 3, 1),
('639b9726-a03f-4c50-8545-20c3eb11c4cd', '3de31698-8062-4a84-82da-3f578ac689aa', 'optimization', 'System Optimization', 'Configuration / tuning untuk tingkatkan prestasi', NULL, NULL, 4, 1),
('70ba3506-6f7b-4ebf-9817-d0cd2abe78d8', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'cctv', 'CCTV', 'CCTV', NULL, NULL, 0, 1),
('441579f6-c0b3-420d-b1d7-85d4338dbcef', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'alarm', 'Alarm', 'Alarm', NULL, NULL, 1, 1),
('35b04290-b89d-439d-a684-c799021a6152', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'door_access', 'Door Access', 'Door Access', NULL, NULL, 2, 1),
('df1063ea-376e-453c-aac2-8cd286a8631a', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'barrier_gate', 'Barrier Gate', 'Barrier Gate', NULL, NULL, 3, 1),
('634b8715-60a5-418b-8534-2cfd7dfdd48b', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'network_wifi', 'Network / WiFi', 'Network / WiFi', NULL, NULL, 4, 1),
('0ba3c165-c668-499d-a7e6-fd2ad786f287', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'electrical', 'Electrical', 'Electrical', NULL, NULL, 5, 1),
('1d18a02b-98b4-449b-9b65-a3cb421df655', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'intercom', 'Intercom', 'Intercom', NULL, NULL, 6, 1),
('9a594bac-3f5e-4672-ab1f-f9c23459e9ab', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'pa_audio_visual', 'PA / Audio Visual', 'PA / Audio Visual', NULL, NULL, 7, 1),
('4ea2e3fd-206f-4916-b6e7-a91845a5a01c', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'attendance', 'Attendance', 'Attendance', NULL, NULL, 8, 1),
('ad7661be-63eb-4608-bdd6-78519345a3b9', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'smart_home', 'Smart Home', 'Smart Home', NULL, NULL, 9, 1),
('8e585830-5726-4417-be36-e06e55fe2e18', 'c2b9aa99-19a1-4c71-95de-afb6912cddde', 'other', 'Other', 'Other', NULL, NULL, 10, 1),
('1f09ad19-b3fb-4f8a-bfe1-b3f304e9cdf5', 'a67c7617-486d-4012-be8e-ff3d5cb4a727', 'sonic', 'Sonic', 'Sonic', NULL, NULL, 0, 1),
('938102aa-172b-42f8-b572-e80ad85c4fda', 'a67c7617-486d-4012-be8e-ff3d5cb4a727', 'other', 'Other Contractor', 'Kontraktor Lain', NULL, NULL, 1, 1),
('bf362e79-18be-490c-961d-332ec40c2ab5', 'a67c7617-486d-4012-be8e-ff3d5cb4a727', 'unknown', 'Not Sure', 'Tidak Pasti', NULL, NULL, 2, 1),
('91a5136b-76a8-4d92-a6d9-ee72810dd3c7', 'd1e43aad-2886-4b0c-a9f4-eeaae6cf263b', 'yes', 'Yes', 'Ya', NULL, NULL, 0, 1),
('0db8ae0a-dd54-4650-b5ed-fc6704651149', 'd1e43aad-2886-4b0c-a9f4-eeaae6cf263b', 'partial', 'Partially', 'Sebahagian', NULL, NULL, 1, 1),
('5c911c26-33e3-4dae-a15e-19f9674779a5', 'd1e43aad-2886-4b0c-a9f4-eeaae6cf263b', 'no', 'No', 'Tidak', NULL, NULL, 2, 1),
('c7c28663-4ec5-4de0-80e7-ebf72698a841', '80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'residential', 'Residential', 'Residential', NULL, NULL, 0, 1),
('754007ab-c562-4a1e-88d6-fabf1638319e', '80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'shop', 'Shop', 'Shop', NULL, NULL, 1, 1),
('7c1aa4e1-a32f-48b0-bddb-a1348b840913', '80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'office', 'Office', 'Office', NULL, NULL, 2, 1),
('03703c43-4699-4fc3-82a7-7b86d6f15225', '80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'factory', 'Factory', 'Factory', NULL, NULL, 3, 1),
('4bb03ef1-d76e-4c25-92ea-36dca137d992', '80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'warehouse', 'Warehouse', 'Warehouse', NULL, NULL, 4, 1),
('d3eedac4-4dbe-4113-8b48-df1cf870cad2', '80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'school', 'School', 'School', NULL, NULL, 5, 1),
('e1f85865-7faa-4d77-893e-22bb47bf5029', '80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'mosque', 'Mosque', 'Mosque', NULL, NULL, 6, 1),
('395bc891-3085-4ac2-b515-54ac08a164cf', '80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'government', 'Government', 'Government', NULL, NULL, 7, 1),
('4ac95348-626a-48ac-a2ff-54fd1e1cae1b', '80a9c7c0-a120-4c5b-afeb-a26bbf8f78ef', 'other', 'Other', 'Other', NULL, NULL, 8, 1),
('37128ef6-55fe-4c72-8eec-939b0d9b09ed', 'e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'not_working', 'Not Working', 'Sistem langsung tidak berfungsi', NULL, NULL, 0, 1),
('17790ab6-dd62-4806-98f9-22d227217a60', 'e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'partial', 'Partially Working', 'Sebahagian sahaja berfungsi', NULL, NULL, 1, 1),
('74e61ed7-4121-47ef-99d9-e415a0896f3e', 'e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'intermittent', 'Intermittent Issue', 'Masalah datang dan pergi', NULL, NULL, 2, 1),
('e201855c-cab4-482f-855f-166b68065e03', 'e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'performance', 'Performance Issue', 'Sistem berfungsi tetapi tidak normal', NULL, NULL, 3, 1),
('3c3785c7-df47-447a-b72d-ffec0d956117', 'e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'damage', 'Physical Damage', 'Peralatan / kabel rosak', NULL, NULL, 4, 1),
('eda61394-0fc7-4add-961c-85deb4a193d7', 'e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'error', 'Error / Warning', 'Terdapat error atau warning', NULL, NULL, 5, 1),
('8f7c78d7-6712-42d6-ae3e-49375baa9de0', 'e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'connection', 'Connection Issue', 'Offline / communication problem', NULL, NULL, 6, 1),
('cf4444d2-deff-4d98-b303-1e03f7471cb3', 'e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'power', 'Power Issue', 'Tiada power / kerap trip', NULL, NULL, 7, 1),
('ff94bf95-81b6-4256-97a3-20bed52aef00', 'e5c39918-a7c7-4d63-91e6-13a5ee1aba5a', 'unsure', 'Not Sure', 'Tidak pasti punca masalah', NULL, NULL, 8, 1),
('ba0ca028-3ff1-4bf4-8b02-e5eba5b2fab8', 'b49ba95e-aa70-4f99-9cf2-ac51d5ac93a2', 'sonic', 'Sonic', 'Sonic', NULL, NULL, 0, 1),
('b68c565f-cef3-4068-be6f-c41b13b7e074', 'b49ba95e-aa70-4f99-9cf2-ac51d5ac93a2', 'other', 'Other Contractor', 'Kontraktor Lain', NULL, NULL, 1, 1),
('9da7ceeb-d964-4fb3-8d8c-f22075f138f7', 'b49ba95e-aa70-4f99-9cf2-ac51d5ac93a2', 'unknown', 'Not Sure', 'Tidak Pasti', NULL, NULL, 2, 1),
('70f0b11c-c076-492c-99dc-c7adea77a542', '29b45bbd-1ca5-43f0-a276-83e3979c3f45', 'today', 'Today', 'Today', NULL, NULL, 0, 1),
('d0a520c2-6f6c-4122-802e-b9f227489b83', '29b45bbd-1ca5-43f0-a276-83e3979c3f45', '1_3_days', '1–3 Days Ago', '1–3 Days Ago', NULL, NULL, 1, 1),
('b871b378-554c-48f8-958e-384667ae0673', '29b45bbd-1ca5-43f0-a276-83e3979c3f45', '1_week', 'About a Week Ago', 'About a Week Ago', NULL, NULL, 2, 1),
('6deb9afb-a661-4a63-b5de-ea5361907d0a', '29b45bbd-1ca5-43f0-a276-83e3979c3f45', 'more', 'More Than a Week Ago', 'More Than a Week Ago', NULL, NULL, 3, 1),
('3eb32832-fe8d-4310-8da0-bd4ab5b6ed43', '29b45bbd-1ca5-43f0-a276-83e3979c3f45', 'unknown', 'Not Sure', 'Not Sure', NULL, NULL, 4, 1),
('b76cc89e-05bf-4e9d-b764-d67ccabc23b5', '05ecd4f6-83a5-4203-88f9-a8ea4d47390c', 'normal', 'Normal', 'Normal', NULL, NULL, 0, 1),
('b4a49c5d-4e79-4355-a3f3-08d6446c2891', '05ecd4f6-83a5-4203-88f9-a8ea4d47390c', 'urgent', 'Urgent', 'Segera', NULL, NULL, 1, 1),
('c19662c7-b7d7-4038-9fbe-18202615a11f', 'e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'residential', 'Residential', 'Residential', NULL, NULL, 0, 1),
('5bd928eb-7c4c-44a8-b2e9-d417bbbba3b6', 'e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'shop', 'Shop', 'Shop', NULL, NULL, 1, 1),
('8e129610-6a8b-4e30-bcf3-fe3d7af9b3ea', 'e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'office', 'Office', 'Office', NULL, NULL, 2, 1),
('af8723e0-b0c7-4fde-8328-749078bd8f2d', 'e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'factory', 'Factory', 'Factory', NULL, NULL, 3, 1),
('b7826190-53c3-4b2a-8952-e21c78c7ab3f', 'e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'warehouse', 'Warehouse', 'Warehouse', NULL, NULL, 4, 1),
('7a871aa3-de4d-4447-bf92-0c843878bd4f', 'e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'school', 'School', 'School', NULL, NULL, 5, 1),
('a6d431cc-d4a9-41b1-b331-a605ffefb880', 'e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'mosque', 'Mosque', 'Mosque', NULL, NULL, 6, 1),
('396b94c0-dc86-47ac-8474-e10c9925b68d', 'e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'government', 'Government', 'Government', NULL, NULL, 7, 1),
('ad905f9c-d9b1-418c-bb01-70e93289c62e', 'e38ea87c-f034-4e44-be5b-ad4ac3c4372d', 'other', 'Other', 'Other', NULL, NULL, 8, 1)
;

INSERT INTO service_request_sequences (service_code, next_number) VALUES ('inspection', 1), ('maintenance_service', 1) ON DUPLICATE KEY UPDATE next_number=next_number;

-- Keep the existing Troubleshooting & Repair service sequence intact.