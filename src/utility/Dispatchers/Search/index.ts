import { SearchDispatcher } from "./interface";
import SearchResultsDispatcherImpl from "./impl";

function makeSearchDispatcher(): SearchDispatcher {
  const dispatcher: SearchDispatcher = new SearchResultsDispatcherImpl();
  return dispatcher;
}
const dispatcher: SearchDispatcher = makeSearchDispatcher();
export default dispatcher;
