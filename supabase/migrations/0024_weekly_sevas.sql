-- Weekly sevas (e.g. every Saturday's Tirumanjanam) join the seva types.
alter table sevas drop constraint sevas_frequency_check;
alter table sevas add constraint sevas_frequency_check
  check (frequency in ('nitya', 'weekly', 'monthly', 'annual', 'special'));
