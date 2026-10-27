export type AdsPlacement = "top" | "middle" | "bottom" | "blog_top" | "blog_middle" | "blog_end";

export type AdsConfig = Record<AdsPlacement, {
  enabled: boolean;
  code: string;
}>;

export const ADS_CONFIG = {
  "top": {
    "enabled": true,
    "code": "<script>\n  atOptions = {\n    'key' : 'dbdfcde13a5942fb7dac8d6ee6a6b33f',\n    'format' : 'iframe',\n    'height' : 60,\n    'width' : 468,\n    'params' : {}\n  };\n</script>\n<script src=\"https://bicea.org/22/dbdfcde13a5942fb7dac8d6ee6a6b33f\"></script>"
  },
  "middle": {
    "enabled": true,
    "code": "<script>\n  atOptions = {\n    'key' : '626da95b582de2eed6161230ee29d550',\n    'format' : 'iframe',\n    'height' : 300,\n    'width' : 160,\n    'params' : {}\n  };\n</script>\n<script src=\"https://bicea.org/22/626da95b582de2eed6161230ee29d550\"></script>"
  },
  "bottom": {
    "enabled": true,
    "code": "<script>\n  atOptions = {\n    'key' : 'ba8a5c610b834aeaf542a1ba570d83b6',\n    'format' : 'iframe',\n    'height' : 50,\n    'width' : 320,\n    'params' : {}\n  };\n</script>\n<script src=\"https://bicea.org/22/ba8a5c610b834aeaf542a1ba570d83b6\"></script>"
  },
  "blog_top": {
    "enabled": true,
    "code": "<script>\n  atOptions = {\n    'key' : '7416220d9d3e681b9f58ddc33ae4a76e',\n    'format' : 'iframe',\n    'height' : 90,\n    'width' : 728,\n    'params' : {}\n  };\n</script>\n<script src=\"https://bicea.org/22/7416220d9d3e681b9f58ddc33ae4a76e\"></script>"
  },
  "blog_middle": {
    "enabled": true,
    "code": "<script>\n  atOptions = {\n    'key' : '0c2fcafa7ee9a28c092c0fc60f722d60',\n    'format' : 'iframe',\n    'height' : 600,\n    'width' : 160,\n    'params' : {}\n  };\n</script>\n<script src=\"https://bicea.org/22/0c2fcafa7ee9a28c092c0fc60f722d60\"></script>"
  },
  "blog_end": {
    "enabled": true,
    "code": "<script>\n  atOptions = {\n    'key' : '92972a940a6198570bdbc938d83a9bfc',\n    'format' : 'iframe',\n    'height' : 250,\n    'width' : 300,\n    'params' : {}\n  };\n</script>\n<script src=\"https://bicea.org/22/92972a940a6198570bdbc938d83a9bfc\"></script>"
  }
} as const satisfies AdsConfig;
