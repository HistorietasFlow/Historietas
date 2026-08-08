-- Restringe o bucket público de avatars aos limites já usados pela aplicação.
-- Não altera policies nem outros buckets.

update storage.buckets
set
  file_size_limit = 1 * 1024 * 1024,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]::text[]
where id = 'avatars';