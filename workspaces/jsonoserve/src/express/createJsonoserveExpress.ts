import { Request, RequestHandler, Response } from 'express'
import { parseTypeLibrary } from 'jsonotron-js'
import { Template } from 'jsonotron-interfaces'
import { createTemplateProcessor, TemplateProcessorContext, TemplateProcessorFunc } from 'jsonotron-codegen'

/**
 * Represents the properties of a jsonoserve express constructor.
 */
export interface JsonoserveConstructorProps {
  /**
   * The domain to use for any generated JSON schemas.
   */
   domain?: string

   /**
   * An array of resource strings.
   */
  resourceStrings?: string[]

  /**
   * An array of language templates.
   */
  templates?: Template[]
}

/**
 * Creates a new jsonoserve handler that can be used as an Express route handler.
 * @param props The constructor properties.
 */
export function createJsonoserveExpress (props?: JsonoserveConstructorProps): RequestHandler {
  const typeLibrary = parseTypeLibrary({ domain: props?.domain, resourceStrings: props?.resourceStrings })

  const processors: Record<string, TemplateProcessorFunc> = {}

  props?.templates?.forEach(template => {
    processors[template.name] = createTemplateProcessor(template)
  })

  return function (req: Request, res: Response): void {
    if (req.method !== 'GET') {
      res.status(405).send('Only GET method accepted.')
      return
    }

    if (req.path.length < 2) {
      res.status(404).send('Must include a path.')
      return
    }

    const templateName = req.path.substring(1)

    const processor = processors[templateName]

    if (!processor) {
      res.status(400).send(`Unable to find template processor for "${templateName}".`)
      return
    }

    const context: TemplateProcessorContext = {
      typeLibrary,
      generatedDateTime: new Date().toISOString()
    }
  
    const result = processor(context)

    res.send(result)
  }
}
