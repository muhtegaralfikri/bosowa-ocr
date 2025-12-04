module.exports = {
  apps: [
    {
      name: 'bosowa-ocr-backend',
      script: 'dist/src/main.js',
      cwd: __dirname,
      env_file: '.env',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
    },
  ],
};
