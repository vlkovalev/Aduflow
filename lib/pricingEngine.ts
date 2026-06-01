export function calculatePrice(basePrice:number, options:number[]){
 const optionTotal = options.reduce((a,b)=>a+b,0)
 return basePrice + optionTotal
}
