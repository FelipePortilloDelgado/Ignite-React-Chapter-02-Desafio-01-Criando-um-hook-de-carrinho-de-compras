import { truncate } from 'fs';
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

  async function verifyStock(productId: number):Promise<boolean> {
    const response = await api.get(`/stock/${productId}`);
    const stock = response.data as Stock;
    const amountCart = cart.find((product) => product.id === productId)?.amount || 0;
    
    if(Number(amountCart) < stock.amount) {
      return true;
    }
    return false;
  }

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const hasStock = await verifyStock(productId);

      if(!hasStock) {
        toast('Quantidade solicitada fora de estoque');
        return;
      }

      const response = await api.get(`/products/${productId}`);
      const product = response.data as Product;

      const productExistsInCart = cart.find((product) => product.id === productId);

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
      const newCart = cart.filter((product) => product.id !== productId);

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if(amount === 1){
        const hasStock = await verifyStock(productId);

        if(!hasStock) {
          toast('Quantidade solicitada fora de estoque');
          return;
        }
      }

      const newCart = cart.map((product) => {
        if(product.id === productId) {
          product.amount += amount;
          return product;
        }
        return product;
      });

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      // TODO
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
