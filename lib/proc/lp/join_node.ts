/**
 * Copyright 2018 The Lovefield Project Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {JoinPredicate} from '../../pred/join_predicate';
import {LogicalQueryPlanNode} from './logical_query_plan_node';

export class JoinNode extends LogicalQueryPlanNode {
  constructor(
      readonly predicate: JoinPredicate, readonly isOuterJoin: boolean) {
    super();
  }

  public toString(): string {
    return `join(type: ${this.isOuterJoin ? 'outer' : 'inner'}, ` +
        `${this.predicate.toString()})`;
  }
}
