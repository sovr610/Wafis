
export interface FrameworkEl {
    tag: any;
    type: any;
    key: any;
    props: any;
  }
  
  const WafisFramework = {
    createElement: (
      tag: any,
      props: any,
      ...children: any[]
    ): FrameworkEl => {
      if (typeof tag === 'function') {
        // Handle functional components
        return tag(props, ...children);
      }
  
      const element: FrameworkEl = {
        tag,
        type: tag,
        key: props?.key || null,
        props: { ...props, children },
      };
  
      return element;
    },
  };
  
  export function render(frameworkEl: FrameworkEl, container: Element | null) {
    if (typeof frameworkEl === 'string' || typeof frameworkEl === 'number') {
      container?.appendChild(document.createTextNode(frameworkEl.toString()));
      return;
    }
  
    const actualDOMElement = document.createElement(frameworkEl.tag);
  
    // Apply Props to actual DOM Element
    Object.keys(frameworkEl.props)
      .filter(key => key !== 'children')
      .forEach(property => {
        actualDOMElement[property] = frameworkEl.props[property];
      });
  
    // Render children inside this element
    frameworkEl.props.children.forEach((child: any) => {
      render(child, actualDOMElement);
    });
  
    container?.appendChild(actualDOMElement);
  };
  export default WafisFramework;
