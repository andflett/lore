import { END, START, StateGraph } from "@langchain/langgraph";
import { AgentState, type AgentStateType } from "./state";
import { decideNode, searchNode, groundNode, MAX_SEARCHES } from "./nodes";

function afterDecide(state: AgentStateType): "search" | typeof END {
  return state.needsSearch ? "search" : END;
}

function afterGround(state: AgentStateType): "search" | typeof END {
  if (state.retrievalCount >= MAX_SEARCHES) return END;
  if (state.hasEnoughContext) return END;
  return "search";
}

// decide → (search → ground → [loop]) → END. The ground node checks the
// retrieved sources actually hold the hard facts, looping for a definitional
// search when they don't. The final answer is streamed separately by the
// bridge using the gathered state (results + context).
const graph = new StateGraph(AgentState)
  .addNode("decide", decideNode)
  .addNode("search", searchNode)
  .addNode("ground", groundNode)
  .addEdge(START, "decide")
  .addConditionalEdges("decide", afterDecide, { search: "search", [END]: END })
  .addEdge("search", "ground")
  .addConditionalEdges("ground", afterGround, { search: "search", [END]: END });

export const agentGraph = graph.compile();
