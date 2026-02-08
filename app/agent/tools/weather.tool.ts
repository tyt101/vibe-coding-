import { z } from 'zod';
import { ToolConfig } from '../types/tool.types';

interface WeatherParams {
  city: string;
}

// 城市名称到高德地图城市编码的映射
const cityCodeMap: Record<string, string> = {
  北京: '110100',
  上海: '310100',
  广州: '440100',
  深圳: '440300',
  杭州: '330100',
  成都: '510100',
  重庆: '500100',
  天津: '120100',
  南京: '320100',
  武汉: '420100',
  西安: '610100',
  郑州: '410100',
  苏州: '320500',
  长沙: '430100',
  沈阳: '210100',
  青岛: '370200',
  济南: '370100',
  大连: '210200',
  厦门: '350200',
  福州: '350100',
  无锡: '320200',
  合肥: '340100',
  昆明: '530100',
  哈尔滨: '230100',
  长春: '220100',
  石家庄: '130100',
  太原: '140100',
  南昌: '360100',
  贵阳: '520100',
  南宁: '450100',
  兰州: '620100',
  乌鲁木齐: '650100',
  银川: '640100',
  西宁: '630100',
  呼和浩特: '150100',
  拉萨: '540100',
  海口: '460100',
  三亚: '460200',
};

export const weatherTool: ToolConfig<WeatherParams> = {
  name: 'weather',
  description: '查询指定城市的天气信息',
  enabled: true,
  schema: z.object({
    city: z.string().describe('要查询天气的城市名称'),
  }),
  handler: async (params?: WeatherParams) => {
    if (!params) return '';
    const { city } = params;

    const apiKey = '6b621560b933551899549c23bafea1d0';
    if (!apiKey) {
      return '❌ 错误：未配置高德地图 API Key，请在环境变量中设置 AMAP_API_KEY';
    }

    // 获取城市编码
    const cityCode = cityCodeMap[city];
    if (!cityCode) {
      return `❌ 抱歉，暂不支持查询"${city}"的天气信息。\n\n支持的城市包括：${Object.keys(cityCodeMap).join('、')}`;
    }

    try {
      // 调用高德地图天气 API
      const response = await fetch(
        `https://restapi.amap.com/v3/weather/weatherInfo?city=${cityCode}&extensions=base&output=json&key=${apiKey}`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5秒超时
        }
      );

      if (!response.ok) {
        return `❌ 天气查询失败：HTTP ${response.status}`;
      }

      const data = await response.json();

      // 检查 API 返回状态
      if (data.status !== '1' || !data.lives || data.lives.length === 0) {
        return `❌ 天气查询失败：${data.info || '未知错误'}`;
      }

      const weather = data.lives[0];

      // 格式化天气信息
      return `${city}的天气情况：
🌡️ 温度：${weather.temperature}°C
☁️ 天气：${weather.weather}
💨 风向：${weather.winddirection}风
🌪️ 风力：${weather.windpower}级
💧 湿度：${weather.humidity}%
📅 发布时间：${weather.reporttime}`;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          return `❌ 天气查询超时，请稍后重试`;
        }
        return `❌ 天气查询失败：${error.message}`;
      }
      return `❌ 天气查询失败：未知错误`;
    }
  },
  options: {
    timeout: 5000,
    apiKey: process.env.AMAP_API_KEY,
  },
};

