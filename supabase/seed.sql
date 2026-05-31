
insert into
  subjects (module_code, level, title)
values
  ('CS1010S', 'nus', 'Programming Methodology'),
  ('CS1231S', 'nus', 'Discrete Structures'),
  ('CS2030S', 'nus', 'Programming Methodology II'),
  ('CS2040S', 'nus', 'Data Structures and Algorithms'),
  ('CS2100', 'nus', 'Computer Organisation'),
  ('CS2103T', 'nus', 'Software Engineering'),
  ('CS3230', 'nus', 'Design and Analysis of Algorithms'),
  ('CS4231', 'nus', 'Parallel and Distributed Algorithms'),
  ('MA1521', 'nus', 'Calculus for Computing'),
  ('MA1522', 'nus', 'Linear Algebra for Computing'),
  ('MA2001', 'nus', 'Linear Algebra I'),
  ('ST2334', 'nus', 'Probability and Statistics'),
  ('IS1108', 'nus', 'Digital Ethics and Data Privacy'),
  ('GEA1000', 'nus', 'Quantitative Reasoning with Data'),
  ('BT1101', 'nus', 'Introduction to Business Analytics'),
  ('EC1301', 'nus', 'Principles of Economics'),
  ('O-MATH', 'o_level', 'O-Level Elementary & Additional Mathematics'),
  ('O-PHYS', 'o_level', 'O-Level Physics'),
  ('A-MATH', 'a_level', 'A-Level H2 Mathematics'),
  ('A-COMP', 'a_level', 'A-Level H2 Computing');

insert into
  auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'aiden@u.nus.edu',
    '',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Aiden Tan"}',
    false,
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'priya@u.nus.edu',
    '',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Priya Sharma"}',
    false,
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'marcus@u.nus.edu',
    '',
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Marcus Lim"}',
    false,
    '',
    '',
    '',
    ''
  );

update profiles
set
  faculty = 'Computer Science',
  year = 'Year 3',
  is_active = true,
  avatar_color = 'bg-indigo-500',
  rate_per_hour = 35,
  avg_rating = 4.9,
  rating_count = 42,
  sessions_completed = 47,
  sessions_booked = 49
where
  id = '11111111-1111-4111-8111-111111111111';

update profiles
set
  faculty = 'Data Science & Analytics',
  year = 'Year 2',
  is_active = true,
  avatar_color = 'bg-violet-500',
  rate_per_hour = 28,
  avg_rating = 4.8,
  rating_count = 28,
  sessions_completed = 31,
  sessions_booked = 33
where
  id = '22222222-2222-4222-8222-222222222222';

update profiles
set
  faculty = 'Computer Science',
  year = 'Year 3',
  is_active = false,
  avatar_color = 'bg-emerald-500',
  rate_per_hour = 30,
  avg_rating = 4.6,
  rating_count = 20,
  sessions_completed = 23,
  sessions_booked = 27
where
  id = '33333333-3333-4333-8333-333333333333';

insert into
  tutor_modules (tutor_id, module_code, grade, completed_at, is_verified)
values
  ('11111111-1111-4111-8111-111111111111', 'CS2040S', 'A+', '2025-12-01', true),
  ('11111111-1111-4111-8111-111111111111', 'CS2030S', 'A+', '2025-05-01', true),
  ('11111111-1111-4111-8111-111111111111', 'CS3230', 'A', '2025-12-01', true),
  ('22222222-2222-4222-8222-222222222222', 'MA1521', 'A+', '2025-05-01', true),
  ('22222222-2222-4222-8222-222222222222', 'ST2334', 'A+', '2025-12-01', true),
  ('22222222-2222-4222-8222-222222222222', 'MA2001', 'A', '2024-12-01', true),
  ('33333333-3333-4333-8333-333333333333', 'CS1231S', 'A+', '2024-05-01', true),
  ('33333333-3333-4333-8333-333333333333', 'CS2040S', 'A', '2023-12-01', true),
  ('33333333-3333-4333-8333-333333333333', 'CS2100', 'A+', '2024-05-01', true);
