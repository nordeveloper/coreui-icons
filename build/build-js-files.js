const fs = require('fs')
console.log(process.argv.join(','))
const directory = process.argv.join(',').includes('flags') ? 'flags/' :
                    process.argv.join(',').includes('brands') ? 'brands/' : ''

let dirname = `${directory}svg/`
fs.readdir(dirname, function(e, filenames) {
  if (e) {
    return
  }
  let contents = {}
  let names = []
  filenames.forEach(function(filename) {
    fs.readFile(dirname + filename, 'utf-8', function(e, content) {
      if (e) {
        return
      } else {
        let variableName = getVariableName(filename, directory)
        let jsFilename = filename.replace('.svg', '.js')
        const viewBox = getAttributeValue(content, 'viewBox').split(' ')
        const dimensions = `${viewBox[2]} ${viewBox[3]}`

        let iconData = []
        if (dimensions !== '64 64') {
          iconData.push(dimensions)
        }
        const computedContent = content.replace(/(<svg([^>]+)>)|(<\/svg>)/ig, '')
                                       .replace(/\n/g, '').replace(/"/g, '\'')
                                       .replace('<!-- Generated by IcoMoon.io -->', '')
        iconData.push(computedContent)

        contents[variableName] = iconData

        // variableName = validate(variableName)
        // jsFilename = validate(jsFilename)
        importName = validate(variableName)

        names.push({
          jsFilename,
          variableName,
          importName
        })

        fs.writeFile(
          `${directory}js/${jsFilename}`,
          `export const ${importName} = ` + JSON.stringify(iconData),
          () => ''
        )
      }
    })
  })
  setTimeout(() => {
    fs.writeFile(
      `${directory}js/icon-set.js`,
      'export const iconSet = ' + JSON.stringify(contents),
      () => ''
    )
    fs.writeFile(
      `${directory}index.js`,
      getImports(names),
      () => ''
    )
  }, 1000)

})

// const toPascalCase = function (name) {
//   return name.match(/[A-Za-z0-9]+/gi)
//     .map(function (word) {
//       return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
//     })
//     .join('')
// }

const getAttributeValue = (string, attribute) => {
  const regex = new RegExp(`${attribute}="([^"]+)"`, 'g')
  return string.match(regex, '')[0]
               .match(/"(.*?)"/ig, '')[0]
               .replace(/"/g, '')
}

function getVariableName (filename, directory) {
  if (directory.includes('flags')) {
    return filename.replace('.svg', '').replace(/-/g, '').toUpperCase()
  } else {
    return toCamel(filename.replace('.svg', ''))
  }
}

function toCamel (str) {
  return str.replace(/([-_][a-z0-9])/ig, ($1) => {
    return $1.toUpperCase().replace('-', '')
  })
}

function validate(str) {
  if (!isNaN(str.charAt(0))) {
    return 'n' + str
  } else {
    return str
  }
}

function getImports(names) {
  const defaultImport = "import { iconSet } from './js/icon-set.js' \n"
  const defaultExport = "export { iconSet } \n\n\n"
  const importString = names.map(name => {
    return `import { ${name.importName} } from './js/${name.jsFilename}'`
  }).join('\n')
  const exportString = names.map(name => {
    return `export { ${name.importName} }`
  }).join('\n')
  return defaultImport + defaultExport + importString + '\n' + exportString
}
