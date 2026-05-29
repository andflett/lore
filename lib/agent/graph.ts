import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentState, type AgentStateType } from "./state";
import { decideNode, searchNode, assessNode, MAX_SEARCHES } from "./nodes";

function afterDecide(state: AgentStateType): "search" | typeof END {
  return state.needsSearch ? "search" : END;
}

function afterAssess(state: AgentStateType): "search" | typeof END {
  if (state.retrievalCount >= MAX_SEARCHES) return END;
  if (state.hasEnoughContext) return END;
  return "search";
}

// decide → (search → assess → [loop]) → END. The final answer is streamed
// separately by the bridge using the gathered state (results + context).
const graph = new StateGraph(AgentState)
  .addNode("decide", decideNode)
  .addNode("search", searchNode)
  .addNode("assess", assessNode)
  .addEdge(START, "decide")
  .addConditionalEdges("decide", afterDecide, { search: "search", [END]: END })
  .addEdge("search", "assess")
  .addConditionalEdges("assess", afterAssess, { search: "search", [END]: END });

export const agentGraph = graph.compile();
