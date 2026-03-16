import { Card, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../lib/utils";

export function ProductCard({ product }) {
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      !product.isAvailable && "opacity-60 grayscale"
    )}>
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-700">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
            Sin imagen
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute left-2 top-2">
            <Badge variant="destructive">AGOTADO</Badge>
          </div>
        )}
      </div>

      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white leading-tight line-clamp-2">
            {product.name}
          </h3>
          <span className="font-bold text-violet-600 shrink-0">
            C$ {product.price.toFixed(2)}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
          {product.description}
        </p>
      </CardContent>
    </Card>
  );
}
