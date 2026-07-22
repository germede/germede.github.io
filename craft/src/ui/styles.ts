import styled from 'styled-components';
import { COLORS } from './colors';

export const ComponentContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.5rem;
  align-items: center;
  color: ${COLORS.stroke};
`;

export const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 0.5rem;
  justify-content: space-around;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

export const Col = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const Slider = styled.input`
  flex: 1;
`;

export const Dot = styled.div<{ isactive?: boolean; isrunning?: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${(props) =>
    props.isactive ? COLORS.idle : COLORS.inactive};
`;

export const ActionButton = styled.button`
  width: auto;
  padding: 0.7em 1.5em;
`;
