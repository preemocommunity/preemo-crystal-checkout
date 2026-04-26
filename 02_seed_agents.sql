-- ─────────────────────────────────────────────────────────────────────────────
-- 02_seed_agents.sql — Run once to populate agent configs
--
-- TO ADD A NEW AGENT LATER (e.g. agent 13):
--   INSERT INTO crystal_agent_configs (agent_id, agent_name, agent_title, agent_file, system_prompt)
--   VALUES (13, 'NewName', 'the Role', 'NEWNAME_ROLE', 'Full .md content here');
--
-- TO UPDATE AN EXISTING AGENT PROMPT:
--   UPDATE crystal_agent_configs
--   SET system_prompt = 'Full updated .md content here', updated_at = now()
--   WHERE agent_id = 1;  -- change agent_id to target the right one
--
-- No redeploy needed. Active on next conversation.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists crystal_agent_configs (
  id            uuid default gen_random_uuid() primary key,
  agent_id      integer unique not null,
  agent_name    text not null,
  agent_title   text not null,
  agent_file    text not null,
  system_prompt text not null,
  active        boolean default true,
  updated_at    timestamp with time zone default now()
);

insert into crystal_agent_configs (agent_id, agent_name, agent_title, agent_file, system_prompt)
values
(1,  'Sage',        'the Strategist',        'SAGE_STRATEGIST',       '[PASTE SAGE_STRATEGIST.md CONTENT HERE]'),
(2,  'Petunia',     'the Copywriter',        'PETUNIA_COPYWRITER',    '[PASTE PETUNIA_COPYWRITER.md CONTENT HERE]'),
(3,  'Ivy',         'the Business Developer','IVY_BUSINESSDEVELOPER', '[PASTE IVY_BUSINESSDEVELOPER.md CONTENT HERE]'),
(4,  'Basil',       'the Producer',          'BASIL_PRODUCER',        '[PASTE BASIL_PRODUCER.md CONTENT HERE]'),
(5,  'Clover',      'the Moneymaker',        'CLOVER_MONEYMAKER',     '[PASTE CLOVER_MONEYMAKER.md CONTENT HERE]'),
(6,  'Olive',       'the Closer',            'OLIVE_CLOSER',          '[PASTE OLIVE_CLOSER.md CONTENT HERE]'),
(7,  'Juniper',     'the Analytical',        'JUNIPER_ANALYTICAL',    '[PASTE JUNIPER_ANALYTICAL.md CONTENT HERE]'),
(8,  'Flora',       'the Publisher',         'FLORA_PUBLISHER',       '[PASTE FLORA_PUBLISHER.md CONTENT HERE]'),
(9,  'Laurel',      'the Generator',         'LAUREL_GENERATOR',      '[PASTE LAUREL_GENERATOR.md CONTENT HERE]'),
(10, 'Orchid',      'the Searcher',          'ORCHID_SEARCHER',       '[PASTE ORCHID_SEARCHER.md CONTENT HERE]'),
(11, 'Jasmine',     'the Administrator',     'JASMINE_ADMINISTRATOR', '[PASTE JASMINE_ADMINISTRATOR.md CONTENT HERE]'),
(12, 'The Crystal', 'All Twelve. One Mind.', 'THE_CRYSTAL_MASTER',    '[PASTE THE_CRYSTAL_MASTER.md CONTENT HERE]')
on conflict (agent_id) do update
  set system_prompt = excluded.system_prompt,
      agent_name    = excluded.agent_name,
      agent_title   = excluded.agent_title,
      agent_file    = excluded.agent_file,
      updated_at    = now();

-- Enable RLS
alter table crystal_agent_configs enable row level security;
create policy if not exists "Anyone reads agent configs" on crystal_agent_configs
  for select using (true);
