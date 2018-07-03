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

import {ExecType} from '../../base/private_enum';
import {Journal} from '../../cache/journal';
import {Context} from '../../query/context';
import {SelectContext} from '../../query/select_context';

import {Relation} from '../relation';
import {PhysicalQueryPlanNode} from './physical_query_plan_node';

export class LimitStep extends PhysicalQueryPlanNode {
  constructor() {
    super(1, ExecType.FIRST_CHILD);
  }

  public toString(): string {
    return 'limit(?)';
  }

  public toContextString(context: SelectContext): string {
    return this.toString().replace('?', context.limit.toString());
  }

  public execInternal(
      relations: Relation[], journal?: Journal, context?: Context): Relation[] {
    // opt_context must be provided for LimitStep.
    relations[0].entries.splice((context as SelectContext).limit);
    return relations;
  }
}