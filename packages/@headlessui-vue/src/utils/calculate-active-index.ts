function assertNever(x: never): never {
  throw new Error('Unexpected object: ' + x)
}

export enum Focus {
  /** Focus the first non-disabled item. */
  First,

  /** Focus the previous non-disabled item. */
  Previous,

  /** Focus the next non-disabled item. */
  Next,

  /** Focus the last non-disabled item. */
  Last,

  /** Focus a specific item based on the `id` of the item. */
  Specific,

  /** Focus no items at all. */
  Nothing,
}

export function calculateActiveIndex<TItem>(
  //两种状态，自己被选中，反之就是其他状态
  action: { focus: Focus.Specific; id: string } | { focus: Exclude<Focus, Focus.Specific> },
  //回调函数
  resolvers: {
    resolveItems(): TItem[]
    resolveActiveIndex(): number | null
    resolveId(item: TItem): string
    resolveDisabled(item: TItem): boolean
  }
) {
  //findIndex返回的是找第一个索引，没找到返回-1
  let items = resolvers.resolveItems()
  if (items.length <= 0) return null

  let currentActiveIndex = resolvers.resolveActiveIndex()
  let activeIndex = currentActiveIndex ?? -1 // 如果为undefined 或者 null 则 为 -1
  //?? 运算符是为了合并空值，然而又使得 '' 与 0 为有效值 [而不是 || 设置默认值，会产生问题]
  //例如：你的给的字符长是'' 但是默认值为 'sdf', 使用|| 就会使得默认值，覆盖要传的空字符串

  let nextActiveIndex = (() => {
    //对于不同指令进行操作
    switch (action.focus) { 
      case Focus.First:
        return items.findIndex(item => !resolvers.resolveDisabled(item))//找到第一个不是禁用的

      case Focus.Previous: {
        //找到反序数组的下标
        let idx = items
          .slice()
          .reverse()
          .findIndex((item, idx, all) => {//找到之后的第一个不是禁用的
            //当有选中，并且到右端点的距离，小于选中的下标【反之就是没找到】
            if (activeIndex !== -1 && all.length - idx - 1 >= activeIndex) return false
            return !resolvers.resolveDisabled(item)
          })
        //表示没有前面
        if (idx === -1) return idx
        //返回正常下标
        return items.length - 1 - idx
      }

      case Focus.Next:
        return items.findIndex((item, idx) => {
          if (idx <= activeIndex) return false
          return !resolvers.resolveDisabled(item)
        })

      case Focus.Last: {
        let idx = items
          .slice()
          .reverse()
          .findIndex(item => !resolvers.resolveDisabled(item))
        if (idx === -1) return idx
        return items.length - 1 - idx
      }

      case Focus.Specific:
        return items.findIndex(item => resolvers.resolveId(item) === action.id)

      case Focus.Nothing:
        return null

      default:
        assertNever(action)
    }
  })()
  //如果操作可行那么返回下次操作下标，否则返回原来下标
  return nextActiveIndex === -1 ? currentActiveIndex : nextActiveIndex
}
