import React, { Component, } from "react"
import PropTypes from "prop-types"
import { List } from "immutable"

const braceOpen = "{"
const braceClose = "}"

export default class ObjectModel extends Component {
  static propTypes = {
    schema: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
    onToggle: PropTypes.func.isRequired,
    specSelectors: PropTypes.object.isRequired,
    name: PropTypes.string,
    isRef: PropTypes.bool,
    expandDepth: PropTypes.number,
    depth: PropTypes.number,
    specPath: PropTypes.object.isRequired,
  }

  render(){

    let { schema, name, isRef, getComponent, depth, specPath, onToggle, expanded, ...otherProps } = this.props
    let { specSelectors,expandDepth } = otherProps

    let description = schema.get("description")
    let properties = schema.get("properties")
    let additionalProperties = schema.get("additionalProperties")
    let title = schema.get("title") || name
    let requiredProperties = schema.get("required")

    const JumpToPath = getComponent("JumpToPath", true)
    const Markdown = getComponent("Markdown")
    const Model = getComponent("Model")
    const ModelCollapse = getComponent("ModelCollapse")

    const JumpToPathSection = () => {
      return <span className="model-jump-to-path"><JumpToPath specPath={specPath} /></span>
    }
    const collapsedContent = (<span>
        <span>{ braceOpen }</span>...<span>{ braceClose }</span>
        {
          isRef ? <JumpToPathSection /> : ""
        }
    </span>)

    const anyOf = specSelectors.isOAS3() ? schema.get("anyOf") : null
    const oneOf = specSelectors.isOAS3() ? schema.get("oneOf") : null
    const not = specSelectors.isOAS3() ? schema.get("not") : null

    const titleEl = title && <span className="model-title">
      { isRef && schema.get("$$ref") && <span className="model-hint">{ schema.get("$$ref") }</span> }
      <span className="model-title__text">{ title }</span>
    </span>

    return <span className="model">
      <ModelCollapse
      modelName={name}
      title={titleEl}
      onToggle = {onToggle}
      expanded={ expanded ? true : depth <= expandDepth }
      collapsedContent={ collapsedContent }>
         <span className="brace-open object">{ braceOpen }</span>
          {
            !isRef ? null : <JumpToPathSection />
          }
          <span className="inner-object">
            {
              <table className="model"><tbody>
              {
                !description ? null : <tr style={{ color: "#999", fontStyle: "italic" }}>
                    <td>description:</td>
                    <td>
                      <Markdown source={ description } />
                    </td>
                  </tr>
              }
              {
                !(properties && properties.size) ? null : properties.entrySeq().map(
                    ([key, value]) => {
                      let isRequired = List.isList(requiredProperties) && requiredProperties.contains(key)
                      let propertyStyle = { verticalAlign: "top", paddingRight: "0.2em" }
                      if ( isRequired ) {
                        propertyStyle.fontWeight = "bold"
                      }

                      return (<tr key={key}>
                        <td style={ propertyStyle }>
                          { key }{ isRequired && <span style={{ color: "red" }}>*</span> }
                        </td>
                        <td style={{ verticalAlign: "top" }}>
                          <Model key={ `object-${name}-${key}_${value}` } { ...otherProps }
                                 required={ isRequired }
                                 getComponent={ getComponent }
                                 specPath={[...specPath, "properties", key]}
                                 schema={ value }
                                 depth={ depth + 1 } />
                        </td>
                      </tr>)
                    }).toArray()
              }
              {
                !additionalProperties || !additionalProperties.size ? null
                  : <tr>
                    <td>{ "< * >:" }</td>
                    <td>
                      <Model { ...otherProps } required={ false }
                             getComponent={ getComponent }
                             specPath={[...specPath, "additionalProperties"]}
                             schema={ additionalProperties }
                             depth={ depth + 1 } />
                    </td>
                  </tr>
              }
              {
                !anyOf ? null
                  : <tr>
                    <td>{ "anyOf ->" }</td>
                    <td>
                      {anyOf.map((schema, k) => {
                        return <div key={k}><Model { ...otherProps } required={ false }
                                 getComponent={ getComponent }
                                 specPath={[...specPath, "anyOf", k]}
                                 schema={ schema }
                                 depth={ depth + 1 } /></div>
                      })}
                    </td>
                  </tr>
              }
              {
                !oneOf ? null
                  : <tr>
                    <td>{ "oneOf ->" }</td>
                    <td>
                      {oneOf.map((schema, k) => {
                        return <div key={k}><Model { ...otherProps } required={ false }
                                 getComponent={ getComponent }
                                 specPath={[...specPath, "oneOf", k]}
                                 schema={ schema }
                                 depth={ depth + 1 } /></div>
                      })}
                    </td>
                  </tr>
              }
              {
                !not ? null
                  : <tr>
                    <td>{ "not ->" }</td>
                    <td>
                      {not.map((schema, k) => {
                        return <div key={k}><Model { ...otherProps } required={ false }
                                 getComponent={ getComponent }
                                 specPath={[...specPath, "not", k]}
                                 schema={ schema }
                                 depth={ depth + 1 } /></div>
                      })}
                    </td>
                  </tr>
              }
              </tbody></table>
          }
        </span>
        <span className="brace-close">{ braceClose }</span>
      </ModelCollapse>
    </span>
  }
}
