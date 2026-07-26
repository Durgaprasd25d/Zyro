import { ADMIN_COLORS } from './theme/colors';

const isProd = import.meta.env.PROD;

const config = {
  development: {
    API_URL: "http://localhost:4000/api",
    SOCKET_URL: "http://localhost:4000",
    MAPBOX_TOKEN: "pk.eyJ1IjoiZHVyZ2EwNyIsImEiOiJjbW14bXo2ZWsyenRvMnJyMG5yOXBtczlrIn0.opLR_TbZiRjBsPfgIOu83g"
  },
  production: {
    API_URL: "https://zyro-s0gj.onrender.com/api",
    SOCKET_URL: "https://zyro-s0gj.onrender.com",
    MAPBOX_TOKEN: "pk.eyJ1IjoiZHVyZ2EwNyIsImEiOiJjbW14bXo2ZWsyenRvMnJyMG5yOXBtczlrIn0.opLR_TbZiRjBsPfgIOu83g"
  }
};

const currentConfig = {
  ...(isProd ? config.production : config.development),
  COLORS: ADMIN_COLORS
};

export default currentConfig;
