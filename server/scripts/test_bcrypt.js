import bcrypt from 'bcryptjs';

const stored = '$2a$10$cnNqplqNOG9ClnktPZhuH.rq6GI3Pb3K5mQh9fMdxRRILtURi2t.6';
const pass = 'Admin@123';

bcrypt
  .compare(pass, stored)
  .then((res) => {
    console.log('bcrypt compare result:', res);
    process.exit(0);
  })
  .catch((e) => {
    console.error('bcrypt error:', e);
    process.exit(1);
  });
