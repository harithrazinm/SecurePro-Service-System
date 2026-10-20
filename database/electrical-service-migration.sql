-- ============================================================
-- SOPro - Electrical Service
-- Questionnaire based on the supplied Electrical Service
-- questionnaire images.
-- ============================================================

-- 1. SERVICE
INSERT INTO services (
    id,
    service_code,
    name_en,
    name_ms,
    category,
    active,
    display_order
)
SELECT
    UUID(),
    'electrical_service',
    'Electrical Service',
    'Electrical Service',
    'installation',
    1,
    10
WHERE NOT EXISTS (
    SELECT 1
    FROM services
    WHERE service_code = 'electrical_service'
);

-- 2. REQUEST SEQUENCE
INSERT INTO service_request_sequences (
    service_code,
    next_number
)
SELECT
    'electrical_service',
    1
WHERE NOT EXISTS (
    SELECT 1
    FROM service_request_sequences
    WHERE service_code = 'electrical_service'
);

-- 3. QUESTIONS
INSERT INTO service_questions (
    id, service_id, question_code, question_type,
    title_en, title_ms, description_en, description_ms,
    unit, required, display_order, active
)
SELECT
    UUID(), s.id, q.question_code, q.question_type,
    q.title_en, q.title_ms, q.description_en, q.description_ms,
    q.unit, q.required, q.display_order, 1
FROM services s
JOIN (
    SELECT 'electrical_premise_type' question_code,'single' question_type,
           'Where is the electrical work required?' title_en,
           'Di mana kerja elektrik diperlukan?' title_ms,
           NULL description_en,NULL description_ms,NULL unit,1 required,1 display_order
    UNION ALL SELECT 'electrical_services','multi',
           'What electrical service is required?','Apakah perkhidmatan elektrik yang diperlukan?',
           'You may select more than one service.','Anda boleh memilih lebih daripada satu perkhidmatan.',NULL,1,2
    UNION ALL SELECT 'wiring_point_quantity','number',
           'How many points are required?','Berapa jumlah point yang diperlukan?',
           NULL,NULL,NULL,1,3
    UNION ALL SELECT 'wiring_point_type','multi',
           'What type of point is required?','Apakah jenis point yang diperlukan?',
           NULL,NULL,NULL,1,4
    UNION ALL SELECT 'wiring_installation_type','single',
           'What type of installation?','Apakah jenis pemasangan?',
           NULL,NULL,NULL,1,5
    UNION ALL SELECT 'wiring_distance','number',
           'Estimated wiring distance','Anggaran jarak wiring',
           NULL,NULL,'m',1,6
    UNION ALL SELECT 'wiring_hacking','single',
           'Is hacking required?','Perlu hacking?',
           NULL,NULL,NULL,1,7
    UNION ALL SELECT 'troubleshooting_problem','textarea',
           'What is the electrical problem?','Apakah masalah elektrik?',
           NULL,NULL,NULL,1,8
    UNION ALL SELECT 'troubleshooting_area','single',
           'Where does the problem occur?','Di mana masalah berlaku?',
           NULL,NULL,NULL,1,9
    UNION ALL SELECT 'troubleshooting_trip_timing','single',
           'When does the trip happen?','Trip berlaku bila?',
           NULL,NULL,NULL,1,10
    UNION ALL SELECT 'troubleshooting_equipment','text',
           'Which equipment causes the trip?','Peralatan manakah yang menyebabkan trip?',
           NULL,NULL,NULL,0,11
    UNION ALL SELECT 'troubleshooting_safety','multi',
           'Are there any of these signs?','Adakah terdapat tanda-tanda berikut?',
           NULL,NULL,NULL,0,12
    UNION ALL SELECT 'db_work_type','single',
           'What work is required for the Distribution Board?','Apakah kerja yang diperlukan untuk Distribution Board?',
           NULL,NULL,NULL,1,13
    UNION ALL SELECT 'db_phase','single',
           'Is the supply Single Phase or 3 Phase?','Bekalan Single Phase atau 3 Phase?',
           NULL,NULL,NULL,1,14
    UNION ALL SELECT 'db_ways','number',
           'How many ways does the DB have?','Berapa way DB jika tahu?',
           NULL,NULL,NULL,0,15
    UNION ALL SELECT 'db_trip','single',
           'Is there a tripping problem?','Ada masalah trip?',
           NULL,NULL,NULL,1,16
    UNION ALL SELECT 'outdoor_work_type','single',
           'What type of outdoor / underground work?','Apakah jenis kerja outdoor / underground?',
           NULL,NULL,NULL,1,17
    UNION ALL SELECT 'outdoor_distance','number',
           'Estimated distance','Anggaran jarak',
           NULL,NULL,'m',1,18
    UNION ALL SELECT 'outdoor_ground','multi',
           'What is the ground / surface condition?','Apakah keadaan kawasan tanah / permukaan?',
           NULL,NULL,NULL,1,19
    UNION ALL SELECT 'outdoor_trenching','single',
           'Is trenching required?','Perlu trenching?',
           NULL,NULL,NULL,1,20
    UNION ALL SELECT 'outdoor_load','textarea',
           'What load / equipment will be connected?','Apakah beban / peralatan yang hendak disambungkan?',
           NULL,NULL,NULL,1,21
    UNION ALL SELECT 'electrical_supply','single',
           'What type of electrical supply does the premise have?','Apakah jenis bekalan elektrik premis?',
           NULL,NULL,NULL,1,22
    UNION ALL SELECT 'electrical_supply_photo','file',
           'Upload DB / Main Switch / TNB meter photo','Upload gambar DB / Main Switch / meter TNB',
           'Required when the electrical supply is not known.','Diperlukan jika jenis bekalan elektrik tidak pasti.',NULL,1,23
    UNION ALL SELECT 'work_location','textarea',
           'Work location','Lokasi kerja',
           'Enter the address, postcode, state / district and any useful location information.',
           'Masukkan alamat, poskod, negeri / daerah dan maklumat lokasi yang berguna.',NULL,1,24
    UNION ALL SELECT 'work_location_map','text',
           'Google Maps location pin','Pin lokasi Google Maps',
           'Optional, but very useful for the technician.','Pilihan, tetapi sangat berguna untuk technician.',NULL,0,25
    UNION ALL SELECT 'work_area_photo','file',
           'Upload work area photo','Upload gambar kawasan kerja',
           'Please upload at least 1 photo of the work area.','Sila upload sekurang-kurangnya 1 gambar kawasan kerja.',NULL,1,26
    UNION ALL SELECT 'additional_photos','file',
           'Additional photos','Gambar tambahan',
           'Optional: DB, point / equipment or problem photos.','Pilihan: gambar DB, point / peralatan atau masalah.',NULL,0,27
) q
ON s.service_code = 'electrical_service'
WHERE NOT EXISTS (
    SELECT 1
    FROM service_questions existing
    WHERE existing.service_id = s.id
      AND existing.question_code = q.question_code
);

-- 4. OPTIONS
INSERT INTO question_options (
    id, question_id, option_value, label_en, label_ms, display_order, active
)
SELECT UUID(), q.id, o.option_value, o.label_en, o.label_ms, o.display_order, 1
FROM service_questions q
JOIN services s ON s.id = q.service_id
JOIN (
    SELECT 'electrical_premise_type' question_code,'house' option_value,'House' label_en,'Rumah' label_ms,1 display_order
    UNION ALL SELECT 'electrical_premise_type','shop','Shop','Kedai',2
    UNION ALL SELECT 'electrical_premise_type','office','Office','Pejabat',3
    UNION ALL SELECT 'electrical_premise_type','factory','Factory','Kilang',4
    UNION ALL SELECT 'electrical_premise_type','school','School','Sekolah',5
    UNION ALL SELECT 'electrical_premise_type','mosque','Mosque','Masjid',6
    UNION ALL SELECT 'electrical_premise_type','other','Others','Lain-lain',7

    UNION ALL SELECT 'electrical_services','new_wiring','New wiring / renovation','Wiring baru / renovation',1
    UNION ALL SELECT 'electrical_services','add_point','Add electrical point','Tambah electrical point',2
    UNION ALL SELECT 'electrical_services','light_fan','Light / fan','Lampu / kipas',3
    UNION ALL SELECT 'electrical_services','socket','Socket / power point','Socket / power point',4
    UNION ALL SELECT 'electrical_services','aircond_point','Aircond point','Aircond point',5
    UNION ALL SELECT 'electrical_services','water_heater','Water heater','Water heater',6
    UNION ALL SELECT 'electrical_services','distribution_board','DB / Distribution Board','DB / Distribution Board',7
    UNION ALL SELECT 'electrical_services','troubleshooting','Electrical trip / troubleshooting','Elektrik trip / troubleshooting',8
    UNION ALL SELECT 'electrical_services','outdoor_underground','Outdoor / underground wiring','Outdoor / underground wiring',9
    UNION ALL SELECT 'electrical_services','three_phase','3 Phase','3 Phase',10
    UNION ALL SELECT 'electrical_services','other','Others','Lain-lain',11

    UNION ALL SELECT 'wiring_point_type','socket','Socket','Socket',1
    UNION ALL SELECT 'wiring_point_type','light','Light','Lampu',2
    UNION ALL SELECT 'wiring_point_type','fan','Fan','Kipas',3
    UNION ALL SELECT 'wiring_point_type','aircond','Aircond','Aircond',4
    UNION ALL SELECT 'wiring_point_type','water_heater','Water Heater','Water Heater',5
    UNION ALL SELECT 'wiring_point_type','other','Others','Lain-lain',6

    UNION ALL SELECT 'wiring_installation_type','surface','Surface','Surface',1
    UNION ALL SELECT 'wiring_installation_type','concealed','Concealed','Concealed',2

    UNION ALL SELECT 'wiring_hacking','yes','Yes','Ya',1
    UNION ALL SELECT 'wiring_hacking','no','No','Tidak',2
    UNION ALL SELECT 'wiring_hacking','unsure','Not sure','Tidak pasti',3

    UNION ALL SELECT 'troubleshooting_area','whole_premise','Whole premise','Seluruh premis',1
    UNION ALL SELECT 'troubleshooting_area','specific_area','Specific area','Kawasan tertentu',2

    UNION ALL SELECT 'troubleshooting_trip_timing','always','All the time','Sentiasa',1
    UNION ALL SELECT 'troubleshooting_trip_timing','sometimes','Sometimes','Kadang-kadang',2
    UNION ALL SELECT 'troubleshooting_trip_timing','specific_equipment','When a specific equipment is used','Apabila peralatan tertentu digunakan',3
    UNION ALL SELECT 'troubleshooting_trip_timing','unknown','Not sure','Tidak pasti',4

    UNION ALL SELECT 'troubleshooting_safety','burning_smell','Burning smell','Bau terbakar',1
    UNION ALL SELECT 'troubleshooting_safety','spark','Spark','Percikan api',2
    UNION ALL SELECT 'troubleshooting_safety','hot','Hot / overheating','Panas / overheating',3
    UNION ALL SELECT 'troubleshooting_safety','none','None','Tiada',4

    UNION ALL SELECT 'db_work_type','new_installation','New installation','Pemasangan baru',1
    UNION ALL SELECT 'db_work_type','upgrade','Upgrade','Upgrade',2
    UNION ALL SELECT 'db_work_type','repair','Repair','Repair',3

    UNION ALL SELECT 'db_phase','single_phase','Single Phase','Single Phase',1
    UNION ALL SELECT 'db_phase','three_phase','3 Phase','3 Phase',2
    UNION ALL SELECT 'db_phase','unsure','Not sure','Tidak pasti',3

    UNION ALL SELECT 'db_trip','yes','Yes','Ya',1
    UNION ALL SELECT 'db_trip','no','No','Tidak',2
    UNION ALL SELECT 'db_trip','unsure','Not sure','Tidak pasti',3

    UNION ALL SELECT 'outdoor_work_type','outdoor','Outdoor','Outdoor',1
    UNION ALL SELECT 'outdoor_work_type','underground','Underground','Underground',2
    UNION ALL SELECT 'outdoor_work_type','both','Both','Kedua-duanya',3

    UNION ALL SELECT 'outdoor_ground','soil','Soil','Tanah',1
    UNION ALL SELECT 'outdoor_ground','concrete','Concrete','Concrete',2
    UNION ALL SELECT 'outdoor_ground','interlocking','Interlocking','Interlocking',3
    UNION ALL SELECT 'outdoor_ground','other','Other','Lain-lain',4

    UNION ALL SELECT 'outdoor_trenching','yes','Yes','Ya',1
    UNION ALL SELECT 'outdoor_trenching','no','No','Tidak',2
    UNION ALL SELECT 'outdoor_trenching','unsure','Not sure','Tidak pasti',3

    UNION ALL SELECT 'electrical_supply','single_phase','Single Phase','Single Phase',1
    UNION ALL SELECT 'electrical_supply','three_phase','3 Phase','3 Phase',2
    UNION ALL SELECT 'electrical_supply','unsure','Not sure','Tidak Pasti',3
) o
ON o.question_code = q.question_code
WHERE s.service_code = 'electrical_service'
  AND NOT EXISTS (
      SELECT 1
      FROM question_options existing
      WHERE existing.question_id = q.id
        AND existing.option_value = o.option_value
  );

-- 5. CONDITIONS
INSERT INTO question_conditions (
    id, question_id, depends_on_question_id, operator, expected_value
)
SELECT UUID(), child.id, parent.id, 'contains', condition_data.expected_value
FROM services s
JOIN (
    SELECT 'electrical_services' parent_code,'wiring_point_quantity' child_code,'new_wiring' expected_value
    UNION ALL SELECT 'electrical_services','wiring_point_quantity','add_point'
    UNION ALL SELECT 'electrical_services','wiring_point_type','new_wiring'
    UNION ALL SELECT 'electrical_services','wiring_point_type','add_point'
    UNION ALL SELECT 'electrical_services','wiring_installation_type','new_wiring'
    UNION ALL SELECT 'electrical_services','wiring_installation_type','add_point'
    UNION ALL SELECT 'electrical_services','wiring_distance','new_wiring'
    UNION ALL SELECT 'electrical_services','wiring_distance','add_point'
    UNION ALL SELECT 'electrical_services','wiring_hacking','new_wiring'
    UNION ALL SELECT 'electrical_services','wiring_hacking','add_point'

    UNION ALL SELECT 'electrical_services','troubleshooting_problem','troubleshooting'
    UNION ALL SELECT 'electrical_services','troubleshooting_area','troubleshooting'
    UNION ALL SELECT 'electrical_services','troubleshooting_trip_timing','troubleshooting'
    UNION ALL SELECT 'electrical_services','troubleshooting_equipment','troubleshooting'
    UNION ALL SELECT 'electrical_services','troubleshooting_safety','troubleshooting'

    UNION ALL SELECT 'electrical_services','db_work_type','distribution_board'
    UNION ALL SELECT 'electrical_services','db_phase','distribution_board'
    UNION ALL SELECT 'electrical_services','db_ways','distribution_board'
    UNION ALL SELECT 'electrical_services','db_trip','distribution_board'

    UNION ALL SELECT 'electrical_services','outdoor_work_type','outdoor_underground'
    UNION ALL SELECT 'electrical_services','outdoor_distance','outdoor_underground'
    UNION ALL SELECT 'electrical_services','outdoor_ground','outdoor_underground'
    UNION ALL SELECT 'electrical_services','outdoor_trenching','outdoor_underground'
    UNION ALL SELECT 'electrical_services','outdoor_load','outdoor_underground'

    UNION ALL SELECT 'electrical_supply','electrical_supply_photo','unsure'
) condition_data
ON 1=1
JOIN service_questions parent
  ON parent.service_id = s.id
 AND parent.question_code = condition_data.parent_code
JOIN service_questions child
  ON child.service_id = s.id
 AND child.question_code = condition_data.child_code
WHERE s.service_code = 'electrical_service'
  AND NOT EXISTS (
      SELECT 1
      FROM question_conditions existing
      WHERE existing.question_id = child.id
        AND existing.depends_on_question_id = parent.id
        AND existing.expected_value = condition_data.expected_value
  );

-- Verification
SELECT service_code, name_en, name_ms, active
FROM services
WHERE service_code = 'electrical_service';

SELECT *
FROM service_request_sequences
WHERE service_code = 'electrical_service';

SELECT
    q.question_code,
    q.question_type,
    q.display_order,
    q.required
FROM service_questions q
JOIN services s ON s.id = q.service_id
WHERE s.service_code = 'electrical_service'
ORDER BY q.display_order;
