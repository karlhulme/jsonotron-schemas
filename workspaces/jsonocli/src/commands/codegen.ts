import { mkdir, writeFile } from 'fs/promises'
import fetch from 'node-fetch'
import { Jsonotron } from 'jsonotron-js'

/**
 * Returns code generated by jsonotron in the given language.
 * @param jsonotron A jsonotron instance.
 * @param path A path.
 */
function generateCodeFromJsonotron (jsonotron: Jsonotron, path: string): string {
  if (path.endsWith('.ts')) {
    return jsonotron.getTypescriptInterfaces()
  } else {
    throw new Error(`Extension of path not recognised.`)
  }
}

/**
 * Clone the systems at a remote jsonoserve server and store them
 * as local JSON files.
 * @param serverUrl The url of a jsonoserve server.
 * @param path: The target path for the output file.
 */
export async function codegen (serverUrl: string, path: string): Promise<void> {
  // normalise the server url
  const normalisedUrl = serverUrl.endsWith('/') ? serverUrl : serverUrl + '/'
  const systemsUrl = normalisedUrl + 'systems'

  // check the path
  if (!path.startsWith('.')) {
    throw new Error('Path should be relative.')
  }

  // ensure all the directories are created, upto the path
  const lastDividerIndex = path.lastIndexOf('/')
  await mkdir(path.slice(0, lastDividerIndex), { recursive: true })

  // fetch the list of systems
  const systemsResult = await fetch(systemsUrl)

  // check the result of the fetch
  if (systemsResult.status !== 200) {
    throw new Error('Unable to retrieve systems from server:\n' +
      `Response code ${systemsResult.status}\n` +
      `${await systemsResult.text()}`
    )
  }

  // convert the systems to json
  const systemsJson = await systemsResult.json()

  // types
  const types: string[] = []

  // loop over the systems
  for (const system of systemsJson.systems) {
    // build the url for a system
    const systemUrl = `${systemsUrl}/${encodeURIComponent(system.domain + '/' + system.system)}`

    // fetch the types for the system
    const systemResult = await fetch(systemUrl)

    // check the result of the fetch
    if (systemResult.status !== 200) {
      throw new Error('Unable to retrieve system from server:\n' +
        `Response code ${systemsResult.status}\n` +
        `${await systemsResult.text()}`
      )
    }

    // convert the result to json
    const systemJson = await systemResult.json()

    // loop over the types
    for (const typeElement of systemJson.types) {
      types.push(typeElement.definition)
    }
  }

  // use a jsonotron to generate code content
  const jsonotron = new Jsonotron({ types })
  const codeContent = generateCodeFromJsonotron(jsonotron, path)

  // write out the code file
  await writeFile(path, codeContent, 'utf8')
}
