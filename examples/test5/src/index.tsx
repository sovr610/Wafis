
import WafisFramework from "./WafisFramework";
import { render, FrameworkEl } from "./WafisFramework";

// Use the component in your markup
const myMarkup = () => {
  return (
    <div data-x="data attribute test">
      <div id="id-test">
        <h1>Wafis</h1>
        <p>Welcome to the wafis framework</p>
      </div>
    </div>
  );
};

render(myMarkup() as FrameworkEl, document.querySelector("#app"));
