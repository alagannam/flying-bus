select id, source_file_name, imported_at, row_count, new_rows, updated_rows,
       source_system, status, notes
from calendar_imports
order by imported_at desc
limit 5;