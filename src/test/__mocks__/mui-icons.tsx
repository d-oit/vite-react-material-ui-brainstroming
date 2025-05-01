import React from 'react'

// Return a simple placeholder for any icon
const MockIcon = (props: any) => <span {...props} data-testid="mock-icon" />

// Export the mock component for every possible icon name
// Using a Proxy allows us to intercept any property access
export default new Proxy(
	{},
	{
		get: function (target, prop) {
			// Return the MockIcon component for any icon requested
			// Check if the property is a component name (usually starts with uppercase)
			if (typeof prop === 'string' && prop[0] === prop[0]?.toUpperCase()) {
				return MockIcon
			}
			// Otherwise, return undefined or handle other exports if necessary
			return undefined
		},
	},
)