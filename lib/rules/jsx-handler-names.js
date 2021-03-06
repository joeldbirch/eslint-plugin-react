/**
 * @fileoverview Enforce event handler naming conventions in JSX
 * @author Jake Marsh
 */

'use strict';

const docsUrl = require('../util/docsUrl');

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: 'Enforce event handler naming conventions in JSX',
      category: 'Stylistic Issues',
      recommended: false,
      url: docsUrl('jsx-handler-names')
    },

    schema: [{
      anyOf: [
        {
          type: 'object',
          properties: {
            eventHandlerPrefix: {type: 'string'},
            eventHandlerPropPrefix: {type: 'string'},
            checkLocalVariables: {type: 'boolean'},
            checkInlineFunction: {type: 'boolean'}
          },
          additionalProperties: false
        }, {
          type: 'object',
          properties: {
            eventHandlerPrefix: {type: 'string'},
            eventHandlerPropPrefix: {
              type: 'boolean',
              enum: [false]
            },
            checkLocalVariables: {type: 'boolean'},
            checkInlineFunction: {type: 'boolean'}
          },
          additionalProperties: false
        }, {
          type: 'object',
          properties: {
            eventHandlerPrefix: {
              type: 'boolean',
              enum: [false]
            },
            eventHandlerPropPrefix: {type: 'string'},
            checkLocalVariables: {type: 'boolean'},
            checkInlineFunction: {type: 'boolean'}
          },
          additionalProperties: false
        }, {
          type: 'object',
          properties: {
            checkLocalVariables: {type: 'boolean'}
          },
          additionalProperties: false
        }, {
          type: 'object',
          properties: {
            checkInlineFunction: {type: 'boolean'}
          },
          additionalProperties: false
        }
      ]
    }]
  },

  create(context) {
    function isPrefixDisabled(prefix) {
      return prefix === false;
    }

    function isInlineHandler(node) {
      return node.value.expression.type === 'ArrowFunctionExpression';
    }

    const configuration = context.options[0] || {};

    const eventHandlerPrefix = isPrefixDisabled(configuration.eventHandlerPrefix)
      ? null
      : configuration.eventHandlerPrefix || 'handle';
    const eventHandlerPropPrefix = isPrefixDisabled(configuration.eventHandlerPropPrefix)
      ? null
      : configuration.eventHandlerPropPrefix || 'on';

    const EVENT_HANDLER_REGEX = !eventHandlerPrefix
      ? null
      : new RegExp(`^((props\\.${eventHandlerPropPrefix || ''})|((.*\\.)?${eventHandlerPrefix}))[A-Z].*$`);
    const PROP_EVENT_HANDLER_REGEX = !eventHandlerPropPrefix
      ? null
      : new RegExp(`^(${eventHandlerPropPrefix}[A-Z].*|ref)$`);

    const checkLocal = !!configuration.checkLocalVariables;

    const checkInlineFunction = !!configuration.checkInlineFunction;

    return {
      JSXAttribute(node) {
        if (
          !node.value
          || !node.value.expression
          || (
            !checkLocal
            && (isInlineHandler(node)
              ? !node.value.expression.body.callee.object
              : !node.value.expression.object
            )
          )
        ) {
          return;
        }

        const propKey = typeof node.name === 'object' ? node.name.name : node.name;
        const expression = node.value.expression;
        const propValue = context.getSourceCode()
          .getText(checkInlineFunction && isInlineHandler(node) ? expression.body.callee : expression)
          .replace(/\s*/g, '')
          .replace(/^this\.|.*::/, '');

        if (propKey === 'ref') {
          return;
        }

        const propIsEventHandler = PROP_EVENT_HANDLER_REGEX && PROP_EVENT_HANDLER_REGEX.test(propKey);
        const propFnIsNamedCorrectly = EVENT_HANDLER_REGEX && EVENT_HANDLER_REGEX.test(propValue);

        if (
          propIsEventHandler
          && propFnIsNamedCorrectly !== null
          && !propFnIsNamedCorrectly
        ) {
          context.report({
            node,
            message: `Handler function for ${propKey} prop key must begin with '${eventHandlerPrefix}'`
          });
        } else if (
          propFnIsNamedCorrectly
          && propIsEventHandler !== null
          && !propIsEventHandler
        ) {
          context.report({
            node,
            message: `Prop key for ${propValue} must begin with '${eventHandlerPropPrefix}'`
          });
        }
      }
    };
  }
};
