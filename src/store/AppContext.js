import React, { useReducer, useEffect, useState, createContext } from 'react';
import { appReducer, initialState } from './appReducer';
import GenealogyDB from '../services/GenealogyDB';
import AuthService from '../services/AuthService';
import FamilyService from '../services/FamilyService';
import { utils } from '../utils/utils';

/**
 * Contexto principal da aplicação.
 * Exponhe: estado, dispatch, instâncias de serviços e flag dbReady.
 */
const AppContext = createContext(null);

/**
 * Provider que inicializa o banco IndexedDB e os serviços,
 * elimina os antipadrões window.db / window.authService / window.familyService
 * e disponibiliza tudo via contexto.
 */
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Instâncias dos serviços — null até a inicialização ser concluída
  const [db, setDb] = useState(null);
  const [authService, setAuthService] = useState(null);
  const [familyService, setFamilyService] = useState(null);
  // Flag que indica se o banco e os serviços estão prontos para uso
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Inicializa o banco de dados IndexedDB
        const genealogyDB = new GenealogyDB();
        await genealogyDB.init();

        const auth = new AuthService(genealogyDB);
        const families = new FamilyService(genealogyDB);

        // Verifica se existe um usuário demo salvo
        const demoUser = await genealogyDB.getOneByIndex(
          'users',
          'email',
          'demo@genealogiaia.com.br'
        );

        if (demoUser) {
          // Restaura a sessão do usuário demo existente
          dispatch({ type: 'SET_CURRENT_USER', payload: { ...demoUser, password: undefined } });
          const userFamilies = await families.getFamiliesForUser(demoUser.id);
          if (userFamilies.length > 0) {
            dispatch({ type: 'SET_CURRENT_FAMILY', payload: userFamilies[0] });
          }
          localStorage.setItem('currentUserId', demoUser.id);
        } else {
          // Cria um novo usuário demo na primeira execução
          const newUser = {
            id: utils.generateId(),
            email: 'demo@genealogiaia.com.br',
            password: utils.hashPassword('demo123'),
            name: 'Usuário Demo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
          };

          await genealogyDB.add('users', newUser);

          // Cria a família padrão do demo
          const newFamily = {
            id: utils.generateId(),
            ownerId: newUser.id,
            name: 'Minha Família',
            description: 'Família de demonstração',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await genealogyDB.add('families', newFamily);

          dispatch({ type: 'SET_CURRENT_USER', payload: { ...newUser, password: undefined } });
          dispatch({ type: 'SET_CURRENT_FAMILY', payload: newFamily });
          localStorage.setItem('currentUserId', newUser.id);
        }

        // Armazena as instâncias no estado local do Provider (não no window)
        setDb(genealogyDB);
        setAuthService(auth);
        setFamilyService(families);
        setDbReady(true);
      } catch (err) {
        console.error('Erro na inicialização da aplicação:', err);
        dispatch({ type: 'SET_ERROR', payload: 'Falha ao inicializar o banco de dados local.' });
        // Marca como pronto mesmo em caso de erro para não bloquear a UI eternamente
        setDbReady(true);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initApp();
  }, []);

  const value = {
    state,
    dispatch,
    db,
    authService,
    familyService,
    dbReady,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
