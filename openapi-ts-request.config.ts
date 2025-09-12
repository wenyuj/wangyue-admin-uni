import type { GenerateServiceProps } from 'openapi-ts-request'

export default [
  {
    schemaPath: 'http://petstore.swagger.io/v2/swagger.json',
    serversPath: './src/service',
    requestLibPath: `import { CustomRequestOptions } from '@/http/types';`,
    requestOptionsType: 'CustomRequestOptions',
    isGenReactQuery: true,
    reactQueryMode: 'vue',
    isGenJavaScript: false,
  },
] as GenerateServiceProps[]
