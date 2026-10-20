-- SecurePro Audio & Visual question migration
-- MySQL 8+. Safe to run more than once; does not overwrite existing question rows/options.
START TRANSACTION;
SET @av_service_id := (SELECT id FROM services WHERE service_code='audio_visual' LIMIT 1);
SELECT @av_service_id AS audio_visual_service_id;

SET @av_questions = '[
{"code":"av_services","type":"multi","en":"What service is required?","ms":"Apakah perkhidmatan yang diperlukan?","required":1,"order":1},
{"code":"av_purpose","type":"multi","en":"What is the system for?","ms":"Sistem ini untuk kegunaan apa?","required":1,"order":2},
{"code":"installation_type","type":"single","en":"How is the installation?","ms":"Pemasangan bagaimana?","required":1,"order":3},
{"code":"length","type":"number","en":"Length (m)","ms":"Panjang (m)","required":0,"order":4},
{"code":"width","type":"number","en":"Width (m)","ms":"Lebar (m)","required":0,"order":5},
{"code":"size","type":"single","en":"Estimated room / space size","ms":"Anggaran saiz ruang?","required":0,"order":6},
{"code":"audience_capacity","type":"single","en":"Estimated users / audience","ms":"Anggaran kapasiti pengguna / audience?","required":1,"order":7},
{"code":"equipment_required","type":"multi","en":"Equipment required","ms":"Equipment yang diperlukan","required":1,"order":8},
{"code":"sound_microphone_count","type":"number","en":"How many microphones are required?","ms":"Berapa mikrofon diperlukan?","required":0,"order":9},
{"code":"sound_microphone_type","type":"single","en":"Wired / Wireless?","ms":"Berwayar / Tanpa Wayar?","required":0,"order":10},
{"code":"sound_usage","type":"single","en":"For speech, music or both?","ms":"Untuk ucapan, muzik atau kedua-duanya?","required":0,"order":11},
{"code":"sound_environment","type":"single","en":"Indoor / Outdoor?","ms":"Indoor / Outdoor?","required":0,"order":12},
{"code":"existing_speaker_system","type":"single","en":"Is there an existing speaker system?","ms":"Ada sistem speaker sedia ada?","required":0,"order":13},
{"code":"display_type","type":"single","en":"Projector or TV / LED Display?","ms":"Projector atau TV / LED Display?","required":0,"order":14},
{"code":"screen_size","type":"text","en":"Estimated screen / display size","ms":"Anggaran saiz skrin / display","required":0,"order":15},
{"code":"presentation_source","type":"multi","en":"Presentation source","ms":"Sumber presentation","required":0,"order":16},
{"code":"display_quantity","type":"number","en":"How many displays are required?","ms":"Berapa display diperlukan?","required":0,"order":17},
{"code":"meeting_participants","type":"single","en":"How many participants?","ms":"Berapa orang peserta?","required":0,"order":18},
{"code":"individual_conference_mics","type":"single","en":"Individual conference microphone required?","ms":"Perlu individual conference microphone?","required":0,"order":19},
{"code":"meeting_platform","type":"multi","en":"Zoom / Teams / Google Meet?","ms":"Zoom / Teams / Google Meet?","required":0,"order":20},
{"code":"auto_tracking_ptz","type":"single","en":"Auto-tracking / PTZ required?","ms":"Perlu auto-tracking / PTZ?","required":0,"order":21},
{"code":"screen_sharing","type":"single","en":"Screen sharing required?","ms":"Perlu screen sharing?","required":0,"order":22},
{"code":"streaming_platform","type":"multi","en":"Streaming platform","ms":"Platform live streaming","required":0,"order":23},
{"code":"streaming_camera_count","type":"number","en":"How many cameras?","ms":"Berapa kamera?","required":0,"order":24},
{"code":"streaming_ptz","type":"single","en":"PTZ required?","ms":"Perlu PTZ?","required":0,"order":25},
{"code":"streaming_mixer_audio","type":"single","en":"Audio from mixer required?","ms":"Perlu audio daripada mixer?","required":0,"order":26},
{"code":"streaming_recording","type":"single","en":"Recording required?","ms":"Perlu recording?","required":0,"order":27},
{"code":"streaming_mode","type":"single","en":"Single platform or multi-platform?","ms":"Single platform atau multi-platform?","required":0,"order":28},
{"code":"existing_equipment","type":"single","en":"Is there any equipment available?","ms":"Adakah equipment sedia ada?","required":1,"order":29},
{"code":"existing_equipment_details","type":"textarea","en":"Existing equipment details (optional — you may skip this question)","ms":"Butiran equipment sedia ada (pilihan, boleh langkau soalan ini)","required":0,"order":30},
{"code":"existing_infrastructure","type":"multi","en":"Existing infrastructure","ms":"Infrastruktur sedia ada","required":1,"order":31},
{"code":"site_visit","type":"single","en":"Do you require a site visit?","ms":"Adakah anda memerlukan lawatan tapak?","required":1,"order":32},
{"code":"budget","type":"single","en":"Budget (optional)","ms":"Budget anggaran (optional)","required":0,"order":33},
{"code":"av_services_other","type":"textarea","en":"Please specify other service","ms":"Sila nyatakan perkhidmatan lain","required":0,"order":34},
{"code":"av_purpose_other","type":"textarea","en":"Please specify other purpose","ms":"Sila nyatakan kegunaan lain","required":0,"order":35}
]';

INSERT INTO service_questions (id,service_id,question_code,question_type,title_en,title_ms,required,display_order,active)
SELECT UUID(), @av_service_id, q.code, q.type, q.title_en, q.title_ms, q.required_flag, q.display_order, 1
FROM JSON_TABLE(@av_questions, '$[*]' COLUMNS(
 code VARCHAR(100) PATH '$.code', type VARCHAR(20) PATH '$.type',
 title_en TEXT PATH '$.en', title_ms TEXT PATH '$.ms',
 required_flag TINYINT PATH '$.required', display_order INT PATH '$.order'
)) q
WHERE @av_service_id IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM service_questions oldq WHERE oldq.service_id=@av_service_id AND oldq.question_code=q.code
);

SET @av_options = '[
["av_services","pa_sound_system","PA / Sound System",1],["av_services","projector_screen","Projector & Screen",2],["av_services","led_display","LED Display",3],["av_services","tv_commercial_display","TV / Commercial Display",4],["av_services","meeting_room_av","Meeting Room AV",5],["av_services","audio_conference","Audio Conference",6],["av_services","video_conference","Video Conference",7],["av_services","microphone_system","Microphone System",8],["av_services","live_streaming","Live Streaming",9],["av_services","ptz_camera","PTZ Camera",10],["av_services","digital_signage","Digital Signage",11],["av_services","lain_lain","Lain-lain",12],
["av_purpose","meeting_room","Meeting Room",1],["av_purpose","training_room","Training Room",2],["av_purpose","dewan","Dewan",3],["av_purpose","masjid_surau","Masjid / Surau",4],["av_purpose","sekolah","Sekolah",5],["av_purpose","pejabat","Pejabat",6],["av_purpose","event_space","Event Space",7],["av_purpose","retail","Retail",8],["av_purpose","lain_lain","Lain-lain",9],
["installation_type","new_system","New System",1],["installation_type","upgrade_existing_system","Upgrade Existing System",2],["installation_type","add_equipment","Add Equipment",3],["installation_type","repair_troubleshooting","Repair / Troubleshooting",4],
["size","small","Small",1],["size","medium","Medium",2],["size","large","Large",3],["size","unknown","Not sure",4],
["audience_capacity","<20","<20",1],["audience_capacity","20–50","20–50",2],["audience_capacity","51–100","51–100",3],["audience_capacity","101–300","101–300",4],["audience_capacity",">300",">300",5],
["equipment_required","speaker","Speaker",1],["equipment_required","amplifier","Amplifier",2],["equipment_required","mixer","Mixer",3],["equipment_required","wired_microphone","Wired Microphone",4],["equipment_required","wireless_microphone","Wireless Microphone",5],["equipment_required","projector","Projector",6],["equipment_required","screen","Screen",7],["equipment_required","display_tv","Display / TV",8],["equipment_required","ptz_camera","PTZ Camera",9],["equipment_required","video_switcher","Video Switcher",10],["equipment_required","conference_microphone","Conference Microphone",11],["equipment_required","dsp","DSP",12],["equipment_required","controller","Controller",13],["equipment_required","rack","Rack",14],["equipment_required","ups","UPS",15],
["sound_microphone_type","wired","Wired",1],["sound_microphone_type","wireless","Wireless",2],["sound_usage","speech","Speech",1],["sound_usage","music","Music",2],["sound_usage","both","Both",3],["sound_environment","indoor","Indoor",1],["sound_environment","outdoor","Outdoor",2],["sound_environment","both","Both",3],["existing_speaker_system","yes","Yes",1],["existing_speaker_system","no","No",2],["existing_speaker_system","not_sure","Not sure",3],
["display_type","projector","Projector",1],["display_type","tv_led_display","TV / LED Display",2],["display_type","both","Both",3],["presentation_source","laptop_pc","Laptop / PC",1],["presentation_source","hdmi","HDMI",2],["presentation_source","wireless_presentation","Wireless Presentation",3],
["meeting_participants","<10","<10",1],["meeting_participants","10–20","10–20",2],["meeting_participants","21–50","21–50",3],["meeting_participants",">50",">50",4],["individual_conference_mics","yes","Yes",1],["individual_conference_mics","no","No",2],["individual_conference_mics","not_sure","Not sure",3],["meeting_platform","zoom","Zoom",1],["meeting_platform","microsoft_teams","Microsoft Teams",2],["meeting_platform","google_meet","Google Meet",3],["meeting_platform","others","Others",4],["auto_tracking_ptz","yes","Yes",1],["auto_tracking_ptz","no","No",2],["auto_tracking_ptz","not_sure","Not sure",3],["screen_sharing","yes","Yes",1],["screen_sharing","no","No",2],["screen_sharing","not_sure","Not sure",3],
["streaming_platform","facebook","Facebook",1],["streaming_platform","youtube","YouTube",2],["streaming_platform","zoom","Zoom",3],["streaming_platform","others","Others",4],["streaming_ptz","yes","Yes",1],["streaming_ptz","no","No",2],["streaming_ptz","not_sure","Not sure",3],["streaming_mixer_audio","yes","Yes",1],["streaming_mixer_audio","no","No",2],["streaming_mixer_audio","not_sure","Not sure",3],["streaming_recording","yes","Yes",1],["streaming_recording","no","No",2],["streaming_recording","not_sure","Not sure",3],["streaming_mode","single_platform","Single Platform",1],["streaming_mode","multi_platform","Multi-platform",2],
["existing_equipment","none","None",1],["existing_equipment","yes","Yes",2],["existing_equipment","not_sure","Not sure",3],["existing_infrastructure","network_internet","Network / Internet",1],["existing_infrastructure","electrical_point","Electrical Point",2],["existing_infrastructure","lan_cabling","LAN Cabling",3],["existing_infrastructure","rack","Rack",4],["existing_infrastructure","not_sure","Not sure",5],
["site_visit","required","Required",1],["site_visit","not_required","Not Required",2],["site_visit","unsure","Not sure",3],
["budget","_rm5_000","< RM5,000",1],["budget","rm5k_10k","RM5k–10k",2],["budget","rm10k_30k","RM10k–30k",3],["budget","rm30k_50k","RM30k–50k",4],["budget","_rm50k","> RM50k",5],["budget","need_recommendation_first","Need recommendation first",6]
]';

INSERT INTO question_options (id,question_id,option_value,label_en,label_ms,display_order,active)
SELECT UUID(), sq.id, o.option_value, o.label_text, o.label_text, o.display_order, 1
FROM JSON_TABLE(@av_options, '$[*]' COLUMNS(
 question_code VARCHAR(100) PATH '$[0]', option_value VARCHAR(150) PATH '$[1]',
 label_text VARCHAR(255) PATH '$[2]', display_order INT PATH '$[3]'
)) o
JOIN service_questions sq ON sq.service_id=@av_service_id AND sq.question_code=o.question_code
WHERE @av_service_id IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM question_options oldo WHERE oldo.question_id=sq.id AND oldo.option_value=o.option_value
);

SELECT sq.question_code, sq.question_type, sq.required, sq.active, COUNT(qo.id) AS option_count
FROM service_questions sq LEFT JOIN question_options qo ON qo.question_id=sq.id AND qo.active=1
WHERE sq.service_id=@av_service_id
GROUP BY sq.id,sq.question_code,sq.question_type,sq.required,sq.active
ORDER BY sq.display_order,sq.question_code;
COMMIT;
