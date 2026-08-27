import {
  ChargeNode,
  ConditionNode,
  EndNode,
  StartNode,
} from './BillingFlowNodes';

export const billingFlowNodeTypes = {
  start: StartNode,
  end: EndNode,
  charge: ChargeNode,
  condition: ConditionNode,
};
