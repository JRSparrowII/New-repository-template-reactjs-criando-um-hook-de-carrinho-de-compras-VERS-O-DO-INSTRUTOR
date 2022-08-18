import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
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

    // OUTRA FORMA DE FAZER, SEM USAR O SET
    // const prevCartRef = useRef<Product[]>();
    // useEffect(() =>{
    //   prevCartRef.current = cart;
    // })
    // const cartPreviousValue = prevCartRef.current ?? cart;
    // useEffect(() =>{
    //   if(cartPreviousValue !== cart){
    //     localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    //   }
    // }, [cart, cartPreviousValue]);


    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    // CONVERTENDO A STRING EM JSON 
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      // ATUALIZANDO O NOVO CARRINHO DE COMPRAS
      const updateCart = [...cart];

      // VERIFICANDO ATRAVES DO productId, SE O PRODUTO JA EXISTE
      const productExist = updateCart.find(product => product.id === productId);      

      // PEGANDO OS DADOS DA API PELO ID
      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount;
      // VERIFICANDO SE A QUANTIDADE DO ESTOQUE EXISTE
      const currentAmount = productExist ? productExist.amount : 0;
      // ADICIONANDO + 1 PRODUTO NO CARRINHO
      const amount = currentAmount + 1;

      // CHECANDO AS POSSIBILIDADES CASO A QUANTIDADE DESEJA SEJA MAIOR QUE O ESTOQUE
      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      // SE O PRODUTO JA EXISTIR NO CARRINHO
      if(productExist) {
        productExist.amount = amount;        
      }else{
        // SE FOR UM PRODUTO NOVO NO CARRINHO, PEGUE OS DADOS DA API
        const product = await api.get(`/products/${productId}`);  
        // ENCONTRE O AMOUNT (QUANTIDADE) DELE      
        const newProduct = {
          ...product.data, 
          amount: 1
        }
        // DEPOIS ATUALIZE
        updateCart.push(newProduct);        
      }
      // SET O CARRINHO ATUALIZADO
      setCart(updateCart);
      // E ARMAZENE OS DADOS USANDO LOCALSTORAGE, TRANSFORMANDO O UPDATECART EM STRING USANDO JSONSTRINGFY
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));


    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const updateCart = [...cart];
      const productIndex = updateCart.findIndex(product => product.id === productId);
      // REMOVENDO UM PRODUTO DO CARRINHO
      if (productIndex !== -1){
        updateCart.splice(productIndex, 1);
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      }else{
        // FORCE O SISTEMA A DAR ERRO
        throw Error();
      }
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
      // CHECANDO SE TEM PRODUTOS EM ESTOQUE
      if (amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      // PEGANDO OS DADOS DA API
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      // VERIFICANDO SE A QUANTIDADE PEDIDA E MAIOR QUE O ESTOQUE
      if (amount > stockAmount) {        
        toast.error('Quantidade solicitada fora de estoque'); 
        return;                       
      }  

      const updateCart = [...cart];
      const productExist = updateCart.find(product=> product.id === productId);

      if (productExist) {
        productExist.amount = amount;
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      }else{
        throw Error();
      }
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
