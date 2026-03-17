module.exports = {
  apps: [
    {
      name: "vimes_as",
      instances: 1,
      cwd: "/usr/local/bin/",
      script: "vimes_as"
    },
    {
      name: "envoy",
      instances: 1,
      cwd: "/usr/vimes/scripts",
      script: "envoy -c envoy.yaml"
    },
    {
      name: "www",
      instances: 1,
      cwd: "/usr/vimes/www",
      script: "dist/server.js",
      watch: ["dist"],
      env: {
        NODE_ENV: "production",
        PORT: 8001,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public",
        HL7_AUTOPOST_ENABLE: false
      }
    },
    {
      name: "www_k2",
      instances: 1,
      cwd: "/usr/vimes/www_k2",
      script: "dist/server.js",
      watch: ["dist"],
      env: {
        NODE_ENV: "production",
        PORT: 8002,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public",
        HL7_AUTOPOST_ENABLE: false
      }
    },
    {
      name: "www_k3",
      instances: 4,
      cwd: "/usr/vimes/www_k3",
      script: "dist/server.js",
      watch: ["dist"],
      env: {
        NODE_ENV: "production",
        PORT: 8003,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public",
        HL7_AUTOPOST_ENABLE: false
      }
    },
    {
      name: "www_kiosk",
      instances: 1,
      cwd: "/usr/vimes/www_k3",
      script: "dist/server.js",
      watch: ["dist"],
      env: {
        NODE_ENV: "production",
        PORT: 8004,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public",
        HL7_AUTOPOST_ENABLE: false
      }
    },
    {
      name: "www_tag",
      instances: 1,
      cwd: "/usr/vimes/www_k3",
      script: "dist/server.js",
      watch: ["dist"],
      env: {
        NODE_ENV: "production",
        PORT: 8005,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public",
        HL7_AUTOPOST_ENABLE: false
      }
    },
    {
      name: "labcom",
      instances: 1,
      cwd: "/usr/vimes/www",
      script: "dist/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 8181,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public",
        HL7_AUTOPOST_ENABLE: false
      }
    },
    {
      name: "labcom_k2",
      instances: 1,
      cwd: "/usr/vimes/www_k2",
      script: "dist/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 8182,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public",
        HL7_AUTOPOST_ENABLE: false
      }
    },
    {
      name: "labcom_k3",
      instances: 1,
      cwd: "/usr/vimes/www_k3",
      script: "dist/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 8183,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public",
        HL7_AUTOPOST_ENABLE: false
      }
    },
    {
      name: "webapps",
      instances: 1,
      cwd: "/usr/local/webapps",
      script: "bin/www",
      watch: ["dist"],
      env: {
        NODE_ENV: "production",
        PORT: 81,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public/",
        HL7_AUTOPOST_ENABLE: false
      }
    },
     {
      name: "KIOSK",
      instances: 1,
      cwd: "/usr/local/VIMESKiosk/server",
      script: "./server/server.js",
      watch: ["server"],
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist",
        HL7_AUTOPOST_ENABLE: false
      }
    },
     {
      name: "RegisterOnline",
      instances: 1,
      cwd: "/usr/local/VIMESOnline/backend",
      script: "src/server.js",
      watch: ["dist"],
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist",
        HL7_AUTOPOST_ENABLE: false
      }
    },
    {
      name: "www_pacs",
      instances: 1,
      cwd: "/usr/vimes/www_k3",
      script: "dist/server_pacs.js",
      watch: ["dist"],
      env: {
        NODE_ENV: "production",
        PORT: 8280,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public",
        HL7_AUTOPOST_ENABLE: true,
        HL7_AUTOPOST_DURATION: 60
      }
    },
    {
      name: "ehr_bvk",
      instances: 1,
      cwd: "/usr/vimes/www",
      script: "dist/server.js",
      watch: ["dist"],
      env: {
        NODE_ENV: "production",
        PORT: 8103,
        GRPC_HOST: "10.1.3.200",
        GRPC_PORT: 55051,
        DB_INSTANCE: "vimes_jsc",
        PUBLIC_DIR: "/dist/public/ehr_bvk",
        HL7_AUTOPOST_ENABLE: false
      }
    }

  ]
};
