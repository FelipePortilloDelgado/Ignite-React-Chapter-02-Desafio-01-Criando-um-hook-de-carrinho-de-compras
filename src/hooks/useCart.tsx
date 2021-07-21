import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
       return JSON.parse(storagedCart);
    }

    return [];
  });

  async function verifyStock(productId: number, amount: number):Promise<boolean> {
    const stock = (await api.get<Stock>(`/stock/${productId}`)).data;
    //const amountCart = cart.find((product) => product.id === productId)?.amount || 0;
    
    if(amount <= stock.amount) {
      return true;
    }
    return false;
  }

  async function verifyProduct(productId: number): Promise<boolean> {
    try{
        const productExists = (await api.get(`/products/${productId}`)).data;
    
        if(!productExists){
            throw new Error();
        }

        return true;
    } catch {
        throw new Error();
    }
  }

  const addProduct = async (productId: number) => {
    try {
      // TODO
      await verifyProduct(productId);

      const product = (await api.get<Product>(`/products/${productId}`)).data;

      const productExistsInCart = cart.find((product) => product.id === productId);

      if(productExistsInCart) {
            const hasStock = await verifyStock(productId, productExistsInCart.amount + 1);

            if(!hasStock) {
                toast.error('Quantidade solicitada fora de estoque');
                return;
            }
        }

      let newCart;

      if(productExistsInCart) {
        newCart = cart.map((product) => {
          if(product.id === productId) {
            product.amount += 1;
            return product;
          }
          return product;
        })
      } else {
        newCart = [
          ...cart,
          {
            ...product,
            amount: 1
          }
        ];
      }

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      //await verifyProduct(productId);
      api.get(`/products/${productId}`);

      const newCart = cart.filter((product) => product.id !== productId);

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
        if(amount < 1) {
            return;
        }

        await verifyProduct(productId);

        const hasStock = await verifyStock(productId, amount);

        if(!hasStock) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
        }

        const newCart = cart.map((product) => {
            if(product.id === productId) {
                product.amount = amount;
                return product;
            }
            return product;
        });

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        return {
            productId,
            amount
        };

    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
